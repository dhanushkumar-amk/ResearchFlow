import { Router, Request, Response } from 'express';
import multer from 'multer';
import os from 'os';
import fs from 'fs';
import { ingestDocument, ingestTextContent } from '../agents/ingest';
import { saveDocument, getDocumentsByUserId, deleteDocumentById } from '../db/queries';
import { qdrantClient } from '../db/qdrant';
import { uploadRateLimiter } from '../middleware/rateLimit';
import { AuthRequest } from '../middleware/auth';
import { fetchYoutubeTranscript } from '../utils/youtube';
import { fetchWebpageContent } from '../utils/scraper';
import { QdrantVectorStore } from '@langchain/qdrant';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { ChatGroq } from '@langchain/groq';
import { PromptTemplate } from '@langchain/core/prompts';
import { config } from '../config';
import { uploadFile, deleteFile } from '../utils/s3';
import { localSimilaritySearch, deleteLocalVectors } from '../utils/vectorFallback';

const router = Router();

// Setup Multer for handling file uploads (using system temp dir)
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).single('file');

/**
 * POST /api/documents/ingest-url
 * Accepts YouTube URL or Website URL, scrapes transcript/contents, chunks, embeds,
 * saves Postgres metadata, and vectorizes into Qdrant.
 */
router.post('/ingest-url', async (req: Request, res: Response) => {
  const { url, type, sessionId } = req.body;
  const userId = (req as AuthRequest).userId!;

  if (!url || !type || !sessionId) {
    return res.status(400).json({ error: 'url, type (youtube | website), and sessionId are required' });
  }

  try {
    let scraped: { text: string; title: string };
    
    if (type === 'youtube') {
      console.log(`🎥 [Ingestion] Scraping YouTube transcript: ${url}`);
      scraped = await fetchYoutubeTranscript(url);
    } else if (type === 'website') {
      console.log(`🌐 [Ingestion] Scraping Website webpage: ${url}`);
      scraped = await fetchWebpageContent(url);
    } else {
      return res.status(400).json({ error: 'Invalid URL type. Must be either "youtube" or "website"' });
    }

    // Embed and index Qdrant vectors with Local Fallback
    const { chunkCount, collectionName } = await ingestTextContent({
      text: scraped.text,
      fileName: scraped.title,
      fileType: type,
      sessionId,
    });

    // Save PostgreSQL metadata record (S3 url/key are null since it's a URL scrape)
    const docRecord = await saveDocument(
      userId,
      scraped.title,
      type, // 'youtube' or 'website'
      chunkCount,
      collectionName,
      null,
      null
    );

    console.log(`✅ [URL Ingest Success] Scraped "${scraped.title}" with ${chunkCount} chunks.`);

    res.status(201).json({
      message: 'Successfully indexed URL',
      document: docRecord,
    });

  } catch (error: any) {
    console.error('❌ [URL Ingest Error]:', error.message);
    res.status(500).json({ error: `Ingestion failed: ${error.message}` });
  }
});

/**
 * POST /api/documents/query
 * Queries the active document knowledge base for Q&A inside the Vault page.
 */
router.post('/query', async (req: Request, res: Response) => {
  const { query: searchQuery, sessionId } = req.body;

  if (!searchQuery || !sessionId) {
    return res.status(400).json({ error: 'query and sessionId are required for Knowledge Base search.' });
  }

  try {
    // 1. Initialize embeddings and Qdrant store
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: config.googleApiKey,
      modelName: 'gemini-embedding-001',
    });

    const collectionName = `session_docs_${sessionId.replace(/[^a-zA-Z0-9]/g, '_')}`;

    console.log(`🔍 [Vault RAG Search] Searching collection: ${collectionName} for: "${searchQuery}"`);

    let results: any[] = [];
    let usedLocalFallback = false;

    // Verify collection exists in Qdrant before loading
    try {
      const collections = await qdrantClient.getCollections();
      const collectionExists = collections.collections.some(c => c.name === collectionName);

      if (collectionExists) {
        const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
          url: config.qdrantUrl,
          apiKey: config.qdrantApiKey,
          collectionName: collectionName,
        });

        // Perform similarity search to retrieve top 4 contexts
        results = await vectorStore.similaritySearch(searchQuery, 4);
      } else {
        usedLocalFallback = true;
      }
    } catch (err: any) {
      console.warn('⚠️ [Qdrant Q&A Warning] Qdrant connection failed, using local vector store fallback:', err.message);
      usedLocalFallback = true;
    }

    // Use local vector store fallback if Qdrant is unavailable or collection not found
    if (usedLocalFallback) {
      results = await localSimilaritySearch(collectionName, searchQuery, 4, embeddings);
    }
    
    if (!results || results.length === 0) {
      return res.json({
        answer: "I couldn't find any relevant snippets in your loaded Vault documents. Please make sure the files uploaded actually contain references to your question!"
      });
    }

    const context = results.map(doc => `Source [${doc.metadata.source || 'Document'}]:\n${doc.pageContent}`).join('\n\n');

    // 3. Invoke LLM to answer grounded in contexts
    const llm = new ChatGroq({
      apiKey: config.groqApiKey,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
    });

    const prompt = PromptTemplate.fromTemplate(`
      You are a precise, scholarly Research Assistant.
      Synthesize a detailed, helpful answer to the user's question using strictly the retrieved Vault Contexts below.
      Always cite the source document name next to the facts you present (e.g. "as shown in [Source Name]").
      If the context does not contain enough information to address the query, state that the context lacks sufficient facts, but still offer a brief, logical general deduction.

      ### RETRIEVED VAULT CONTEXTS:
      {context}

      ### USER QUESTION:
      {question}

      ### SCHOLARLY RESPONSE:
    `);

    const formatted = await prompt.format({ context, question: searchQuery });
    const llmResponse = await llm.invoke(formatted);

    res.json({
      answer: llmResponse.content as string,
      sources: results.map(r => r.metadata.source).filter((v, i, a) => a.indexOf(v) === i) // unique sources
    });

  } catch (error: any) {
    console.error('❌ [Vault Q&A Error]:', error.message);
    res.status(500).json({ error: `RAG Q&A query failed: ${error.message}` });
  }
});

/**
 * POST /api/documents/upload
 * Accepts a PDF or TXT file, uploads it to AWS S3, indexes it through the vector RAG pipeline,
 * and saves metadata to PostgreSQL.
 */
router.post('/upload', uploadRateLimiter, (req: Request, res: Response) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('❌ Multer error:', err.message);
      return res.status(400).json({ error: `Upload failed: ${err.message}` });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file provided in field "file"' });
    }

    const { sessionId } = req.body;
    if (!sessionId) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'sessionId is required for scoped storage' });
    }

    try {
      const { originalname, path: filePath, mimetype } = req.file;

      // 1. Upload to AWS S3 (falls back to local filesystem if S3 isn't configured)
      console.log(`☁️ [Ingestion] Processing object storage for: ${originalname}`);
      const { url: s3Url, key: s3Key } = await uploadFile(filePath, originalname, mimetype, sessionId);

      // 2. Trigger the ingestion pipeline (Parsing -> Chunking -> Embedding -> Vector Store)
      const { chunkCount, collectionName } = await ingestDocument({
        filePath,
        fileName: originalname,
        fileType: mimetype,
        sessionId,
      });

      // 3. Persist metadata in PostgreSQL
      const userId = (req as AuthRequest).userId!;
      const docRecord = await saveDocument(
        userId,
        originalname,
        mimetype,
        chunkCount,
        collectionName,
        s3Url,
        s3Key
      );

      // 4. Cleanup: Delete local temporary Multer file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      console.log(`✅ [Upload Success] Document ${originalname} indexed with ${chunkCount} chunks. URL: ${s3Url}`);

      res.status(201).json({
        message: 'Successfully indexed document',
        document: docRecord,
      });

    } catch (error: any) {
      console.error('❌ [Upload Ingestion Error]:', error.message);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: `Ingestion failed: ${error.message}` });
    }
  });
});

/**
 * GET /api/documents
 * Returns all documents associated with a session ID.
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  try {
    const documents = await getDocumentsByUserId(userId);
    res.json(documents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/documents/:id
 * Deletes document from PostgreSQL and clears corresponding vectors in Qdrant & local fallback store.
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const documentId = req.params.id;
  const userId = req.userId!;

  try {
    const doc = await deleteDocumentById(documentId as string, userId);
    if (!doc) {
      return res.status(404).json({ error: 'Document record not found' });
    }

    // 1. Delete from S3 or local persistent storage
    if (doc.s3_key) {
      await deleteFile(doc.s3_key);
    }

    // 2. Delete from local vector store fallback
    await deleteLocalVectors(doc.qdrant_collection_name, doc.filename);

    // 3. Delete from Qdrant if online
    try {
      console.log(`🗑️ [Deletion] Removing vectors for ${doc.filename} in Qdrant collection ${doc.qdrant_collection_name}`);
      await qdrantClient.delete(doc.qdrant_collection_name, {
        filter: {
          must: [
            { key: 'source', match: { value: doc.filename } },
          ],
        },
      });
    } catch (err: any) {
      console.warn('⚠️ [Qdrant Delete Warning] Qdrant server is offline/unreachable:', err.message);
    }

    res.json({ message: `Document ${doc.filename} removed successfully.` });

  } catch (error: any) {
    console.error('❌ [Deletion Error]:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;

import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { QdrantVectorStore } from '@langchain/qdrant';
import { config } from '../config';
import fs from 'fs';
import { QdrantClient } from '@qdrant/js-client-rest';
import { saveLocalVectors } from '../utils/vectorFallback';

/**
 * Phase 33: Document Ingestion Pipeline
 * Corrected imports for LangChain v0.2/v0.3 with Automatic Local Fallback
 */
export async function ingestDocument(params: {
  filePath: string;
  fileName: string;
  fileType: string;
  sessionId: string;
}) {
  const { filePath, fileName, fileType, sessionId } = params;

  console.log(`📑 [Ingestion] Reading ${fileName} (${fileType})`);

  let docs: Document[] = [];

  // 1. Load the document content
  if (fileType === 'application/pdf') {
    const loader = new PDFLoader(filePath);
    docs = await loader.load();
  } else {
    // Plain text or similar
    const text = fs.readFileSync(filePath, 'utf-8');
    docs = [new Document({ pageContent: text })];
  }

  // 2. Split into chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.splitDocuments(docs);

  // 3. Add metadata to chunks
  chunks.forEach((chunk) => {
    chunk.metadata = {
      ...chunk.metadata,
      source: fileName,
      sessionId: sessionId,
      uploadedAt: new Date().toISOString(),
    };
  });

  // 4. Initialize Embeddings
  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: config.googleApiKey,
    modelName: 'gemini-embedding-001',
  });

  // 5. Upload to Qdrant / Local Fallback
  const collectionName = `session_docs_${sessionId.replace(/[^a-zA-Z0-9]/g, '_')}`;

  // Pre-create collection in Qdrant to prevent "Not Found" error
  const qClient = new QdrantClient({
    url: config.qdrantUrl,
    apiKey: config.qdrantApiKey,
    checkCompatibility: false,
  });

  let useLocalFallback = false;

  try {
    const list = await qClient.getCollections();
    const exists = list.collections.some((c) => c.name === collectionName);
    if (!exists) {
      console.log(`🧊 Creating new Qdrant collection: "${collectionName}" (dim: 768)`);
      await qClient.createCollection(collectionName, {
        vectors: { size: 768, distance: 'Cosine' },
      });
    }
  } catch (err: any) {
    console.warn('⚠️ [Qdrant Ingest] Pre-creation warning or server offline. Using local vector store fallback.', err.message);
    useLocalFallback = true;
  }

  if (!useLocalFallback) {
    try {
      console.log(`🔍 [Ingestion] Uploading ${chunks.length} chunks into Qdrant collection: ${collectionName}`);
      await QdrantVectorStore.fromDocuments(chunks, embeddings, {
        url: config.qdrantUrl,
        apiKey: config.qdrantApiKey,
        collectionName: collectionName,
      });
    } catch (err: any) {
      console.error('❌ [Qdrant Upload Error] Falling back to local vector store:', err.message);
      useLocalFallback = true;
    }
  }

  if (useLocalFallback) {
    await saveLocalVectors(collectionName, chunks, embeddings);
  }

  return { chunkCount: chunks.length, collectionName };
}

export async function ingestTextContent(params: {
  text: string;
  fileName: string;
  fileType: 'youtube' | 'website';
  sessionId: string;
}) {
  const { text, fileName, fileType, sessionId } = params;

  console.log(`📑 [Ingestion] Ingesting text content for ${fileName} (${fileType})`);

  const docs = [new Document({ pageContent: text })];

  // 2. Split into chunks
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const chunks = await splitter.splitDocuments(docs);

  // 3. Add metadata to chunks
  chunks.forEach((chunk) => {
    chunk.metadata = {
      ...chunk.metadata,
      source: fileName,
      sessionId: sessionId,
      uploadedAt: new Date().toISOString(),
    };
  });

  // 4. Initialize Embeddings
  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: config.googleApiKey,
    modelName: 'gemini-embedding-001',
  });

  // 5. Upload to Qdrant / Local Fallback
  const collectionName = `session_docs_${sessionId.replace(/[^a-zA-Z0-9]/g, '_')}`;

  // Pre-create collection in Qdrant to prevent "Not Found" error
  const qClient = new QdrantClient({
    url: config.qdrantUrl,
    apiKey: config.qdrantApiKey,
    checkCompatibility: false,
  });

  let useLocalFallback = false;

  try {
    const list = await qClient.getCollections();
    const exists = list.collections.some((c) => c.name === collectionName);
    if (!exists) {
      console.log(`🧊 Creating new Qdrant collection: "${collectionName}" (dim: 768)`);
      await qClient.createCollection(collectionName, {
        vectors: { size: 768, distance: 'Cosine' },
      });
    }
  } catch (err: any) {
    console.warn('⚠️ [Qdrant Ingest] Pre-creation warning or server offline. Using local vector store fallback.', err.message);
    useLocalFallback = true;
  }

  if (!useLocalFallback) {
    try {
      console.log(`🔍 [Ingestion] Uploading ${chunks.length} chunks into Qdrant collection: ${collectionName}`);
      await QdrantVectorStore.fromDocuments(chunks, embeddings, {
        url: config.qdrantUrl,
        apiKey: config.qdrantApiKey,
        collectionName: collectionName,
      });
    } catch (err: any) {
      console.error('❌ [Qdrant Upload Error] Falling back to local vector store:', err.message);
      useLocalFallback = true;
    }
  }

  if (useLocalFallback) {
    await saveLocalVectors(collectionName, chunks, embeddings);
  }

  return { chunkCount: chunks.length, collectionName };
}

import { Router, Request, Response } from 'express';
import multer from 'multer';
import os from 'os';
import fs from 'fs';
import { ingestDocument } from '../agents/ingest';
import { saveDocument, getDocumentsByUserId, deleteDocumentById } from '../db/queries';
import { qdrantClient } from '../db/qdrant';
import { uploadRateLimiter } from '../middleware/rateLimit';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Setup Multer for handling file uploads (using system temp dir)
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).single('file');

/**
 * POST /api/documents/upload
 * Accepts a PDF or TXT file, runs it through the RAG pipeline (chunking + embeddings),
 * saves metadata to Postgres, and stores search vectors in Qdrant.
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

      // 1. Trigger the ingestion pipeline (Parsing -> Chunking -> Embedding -> Qdrant)
      const { chunkCount, collectionName } = await ingestDocument({
        filePath,
        fileName: originalname,
        fileType: mimetype,
        sessionId,
      });

      // 2. Persist metadata in PostgreSQL
      const userId = (req as AuthRequest).userId!;
      const docRecord = await saveDocument(
        userId,
        originalname,
        mimetype,
        chunkCount,
        collectionName
      );

      // 3. Cleanup: Delete local temp file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      console.log(`✅ [Upload Success] Document ${originalname} indexed with ${chunkCount} chunks.`);

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
 * Deletes document from PostgreSQL and clears corresponding vectors in Qdrant.
 */
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  const documentId = req.params.id;
  const userId = req.userId!;

  try {
    const doc = await deleteDocumentById(documentId as string, userId);
    if (!doc) {
      return res.status(404).json({ error: 'Document record not found' });
    }

    console.log(`🗑️ [Deletion] Removing vectors for ${doc.filename} in collection ${doc.qdrant_collection_name}`);
    await qdrantClient.delete(doc.qdrant_collection_name, {
      filter: {
        must: [
          { key: 'source', match: { value: doc.filename } },
          { key: 'userId', match: { value: doc.user_id } },
        ],
      },
    });

    res.json({ message: `Document ${doc.filename} removed successfully.` });

  } catch (error: any) {
    console.error('❌ [Deletion Error]:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;

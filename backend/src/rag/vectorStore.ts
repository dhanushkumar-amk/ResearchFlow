import { QdrantClient } from '@qdrant/js-client-rest';
import { Document } from '@langchain/core/documents';
import { embedChunks, embedText } from './embedder';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

// Dimension of gemini-embedding-001 (based on runtime test)
const VECTOR_SIZE = 3072;

// Initialize Qdrant Client (Standard local dev port 6333)
const client = new QdrantClient({ 
  url: config.qdrantUrl, 
  apiKey: config.qdrantApiKey 
});

/**
 * Ensures a vector collection exists in Qdrant with correct dimensions.
 */
async function ensureCollection(collectionName: string) {
  try {
    const list = await client.getCollections();
    const exists = list.collections.find((c) => c.name === collectionName);

    if (!exists) {
      console.log(`🧊 Creating new Qdrant collection: "${collectionName}" (dim: ${VECTOR_SIZE})...`);
      await client.createCollection(collectionName, {
        vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
      });

      // Optional: Add some indexing for performance
      await client.createPayloadIndex(collectionName, {
        field_name: 'metadata.source',
        field_schema: 'keyword',
      });
    }
  } catch (error: any) {
    console.warn(`⚠️ Collection check error (is Qdrant running?):`, error.message);
  }
}

/**
 * Embeds all chunks and uploads them to Qdrant.
 * collectionName: Unique project ID or research topic.
 * chunks: Array of Document objects (contains pageContent and metadata).
 */
export async function storeChunks(collectionName: string, chunks: Document[]): Promise<void> {
  await ensureCollection(collectionName);

  // 1. Convert docs to flat strings
  const texts = chunks.map((c) => c.pageContent);

  // 2. Embed in batch
  const embeddings = await embedChunks(texts);

  if (embeddings.length > 0) {
    console.log(`📏 Computed embedding dimension: ${embeddings[0].length}`);
  }

  // 3. Prepare payload for Qdrant (vectors + original text + metadata)
  const points = chunks.map((doc, idx) => ({
    id: uuidv4(),
    vector: embeddings[idx],
    payload: {
      text: doc.pageContent,
      metadata: doc.metadata,
      research_session: collectionName,
    },
  }));

  // 4. Batch Upload
  console.log(`📡 Uploading ${points.length} vectors to Qdrant collection: "${collectionName}"...`);
  await client.upsert(collectionName, {
    wait: true,
    points: points,
  });

  console.log(`✅ Success! Data is now vector-searchable.`);
}

/**
 * Checks if a collection exists in Qdrant.
 */
export async function collectionExists(collectionName: string): Promise<boolean> {
  try {
    const list = await client.getCollections();
    return !!list.collections.find((c) => c.name === collectionName);
  } catch {
    return false;
  }
}

/**
 * Searches for top_k relevant chunks for a given query string.
 * This is the core RAG retrieval step.
 */
export async function searchChunks(
  collectionName: string,
  query: string,
  topK: number = 5
): Promise<{ text: string; metadata: any }[]> {
  console.log(`🔍 Searching relevant context in "${collectionName}" for query: "${query}"...`);

  try {
    // 1. Embed exactly the query string
    const queryVector = await embedText(query);

    // 2. Perform vector search (similarity search)
    const result = await client.search(collectionName, {
      vector: queryVector,
      limit: topK,
      with_payload: true,
    });

    // 3. Extract and return text and metadata
    const snippets = result.map((hit: any) => ({
      text: hit.payload?.text as string,
      metadata: hit.payload?.metadata,
    }));
    
    console.log(`📦 Found ${snippets.length} relevant snippet(s).`);
    return snippets;
  } catch (error: any) {
    console.error(`❌ Qdrant search error:`, error.message);
    throw error;
  }
}

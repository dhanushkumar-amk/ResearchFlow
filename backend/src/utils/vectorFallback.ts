import fs from 'fs';
import path from 'path';
import { Document } from '@langchain/core/documents';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';

interface VectorPoint {
  vector: number[];
  pageContent: string;
  metadata: any;
}

// Global in-memory cache to speed up access
const memoryVectorCache: Record<string, VectorPoint[]> = {};

const VECTOR_STORE_FILE = path.join(process.cwd(), 'uploads', 'local_vector_store.json');

// Ensure directory exists
function ensureUploadsDir() {
  const dir = path.dirname(VECTOR_STORE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Load vector store from disk
function loadFromDisk(): Record<string, VectorPoint[]> {
  try {
    ensureUploadsDir();
    if (fs.existsSync(VECTOR_STORE_FILE)) {
      const data = fs.readFileSync(VECTOR_STORE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err: any) {
    console.error('⚠️ [Local Vector Store] Error loading from disk:', err.message);
  }
  return {};
}

// Save vector store to disk
function saveToDisk(store: Record<string, VectorPoint[]>) {
  try {
    ensureUploadsDir();
    fs.writeFileSync(VECTOR_STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err: any) {
    console.error('⚠️ [Local Vector Store] Error saving to disk:', err.message);
  }
}

/**
 * Computes cosine similarity between two vectors
 */
export function cosineSimilarity(A: number[], B: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < A.length; i++) {
    dotProduct += A[i] * B[i];
    normA += A[i] * A[i];
    normB += B[i] * B[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Saves document chunks to local persistent vector store
 */
export async function saveLocalVectors(
  collectionName: string,
  chunks: Document[],
  embeddings: GoogleGenerativeAIEmbeddings
): Promise<void> {
  console.log(`🧊 [Local Vector Store] Embedding and saving ${chunks.length} chunks to local collection: "${collectionName}"...`);
  
  // 1. Get raw texts to embed
  const texts = chunks.map(c => c.pageContent);
  
  // 2. Embed texts
  const vectors = await embeddings.embedDocuments(texts);
  
  // 3. Map vectors to points
  const points: VectorPoint[] = chunks.map((chunk, idx) => ({
    vector: vectors[idx],
    pageContent: chunk.pageContent,
    metadata: chunk.metadata || {},
  }));

  // 4. Save to memory cache and disk
  memoryVectorCache[collectionName] = points;
  
  const diskStore = loadFromDisk();
  diskStore[collectionName] = points;
  saveToDisk(diskStore);
  
  console.log(`✅ [Local Vector Store] Saved "${collectionName}" successfully (size: ${points.length} vectors).`);
}

/**
 * Performs similarity search in the local vector store
 */
export async function localSimilaritySearch(
  collectionName: string,
  query: string,
  k: number,
  embeddings: GoogleGenerativeAIEmbeddings
): Promise<Document[]> {
  console.log(`🔍 [Local Vector Store] Similarity search in "${collectionName}" for: "${query}" (k = ${k})`);
  
  // 1. Load points for collection
  let points = memoryVectorCache[collectionName];
  if (!points) {
    const diskStore = loadFromDisk();
    points = diskStore[collectionName] || [];
    memoryVectorCache[collectionName] = points;
  }

  if (points.length === 0) {
    console.warn(`⚠️ [Local Vector Store] Collection "${collectionName}" is empty or not found.`);
    return [];
  }

  // 2. Embed search query
  const queryVector = await embeddings.embedQuery(query);

  // 3. Compute cosine similarity for each point
  const scoredPoints = points.map(point => {
    const score = cosineSimilarity(queryVector, point.vector);
    return {
      point,
      score,
    };
  });

  // 4. Sort by score descending and take top k
  scoredPoints.sort((a, b) => b.score - a.score);
  const topK = scoredPoints.slice(0, k);

  console.log(`✅ [Local Vector Store] Match scores:`, topK.map(t => `${t.point.metadata.source || 'Doc'}: ${t.score.toFixed(4)}`));

  // 5. Convert back to Documents
  return topK.map(item => new Document({
    pageContent: item.point.pageContent,
    metadata: item.point.metadata,
  }));
}

/**
 * Deletes vectors in local vector store matching filter
 */
export async function deleteLocalVectors(
  collectionName: string,
  filename: string
): Promise<void> {
  console.log(`🗑️ [Local Vector Store] Deleting vectors for "${filename}" from collection "${collectionName}"...`);
  
  const diskStore = loadFromDisk();
  
  // Update memory
  if (memoryVectorCache[collectionName]) {
    memoryVectorCache[collectionName] = memoryVectorCache[collectionName].filter(
      p => p.metadata.source !== filename
    );
  }
  
  // Update disk
  if (diskStore[collectionName]) {
    diskStore[collectionName] = diskStore[collectionName].filter(
      p => p.metadata.source !== filename
    );
    saveToDisk(diskStore);
  }
  
  console.log(`✅ [Local Vector Store] Vectors deleted.`);
}

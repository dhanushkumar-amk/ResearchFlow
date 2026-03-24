import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';

// Initialize the Gemini SDK
const genAI = new GoogleGenerativeAI(config.googleApiKey);
// We use the latest state-of-the-art embedding model
const EMBEDDING_MODEL = 'gemini-embedding-001';

/**
 * Embeds a single string of text.
 * Dimension: 768
 */
export async function embedText(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  return result.embedding.values;
}

/**
 * Embeds multiple strings in batch for efficiency.
 * Max batch size for Gemini is usually 100 per request.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  
  // Gemini's batchEmbedContents expects an array of requests
  const result = await model.batchEmbedContents({
    requests: texts.map((t) => ({
      content: { role: 'user', parts: [{ text: t }] },
    })),
  });

  return result.embeddings.map((e) => e.values);
}

/**
 * Convenience wrapper for Agent 2 to embed many chunks at once.
 * Handles small batches if needed (though Gemini handles 100 well).
 */
export async function embedChunks(chunks: string[]): Promise<number[][]> {
  console.log(`🧠 Embedding ${chunks.length} chunks via Gemini (${EMBEDDING_MODEL})...`);
  
  // Basic batching logic: process 100 at a time
  const batchSize = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < chunks.length; i += batchSize) {
    const slice = chunks.slice(i, i + batchSize);
    const batchResults = await embedBatch(slice);
    allEmbeddings.push(...batchResults);
  }

  return allEmbeddings;
}

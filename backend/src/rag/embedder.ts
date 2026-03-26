import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { getMemory, setMemory } from '../db/redis';
import crypto from 'crypto';

// Initialize the Gemini SDK
const genAI = new GoogleGenerativeAI(config.googleApiKey);
const EMBEDDING_MODEL = 'gemini-embedding-001';
const CACHE_TTL = 604800; // 7 days

/**
 * Creates a unique hash for a piece of text to use as a cache key.
 */
function getHash(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/**
 * Embeds a single string of text.
 */
export async function embedText(text: string): Promise<number[]> {
  const hash = getHash(text);
  const cacheKey = `embed:${hash}`;
  
  // 1. Check Redis Cache
  const cached = await getMemory(cacheKey);
  if (cached && Array.isArray(cached)) {
    return cached;
  }

  // 2. Fetch from Gemini
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const result = await model.embedContent(text);
  const embedding = result.embedding.values;

  // 3. Store in Redis
  await setMemory(cacheKey, embedding, CACHE_TTL);

  return embedding;
}

/**
 * Embeds multiple strings in batch with Redis caching.
 */
export async function embedChunks(chunks: string[]): Promise<number[][]> {
  const results: number[][] = new Array(chunks.length);
  const toEmbed: { index: number; text: string }[] = [];

  // 1. Check Cache for each chunk
  for (let i = 0; i < chunks.length; i++) {
    const hash = getHash(chunks[i]);
    const cached = await getMemory(`embed:${hash}`);
    if (cached && Array.isArray(cached)) {
      results[i] = cached;
    } else {
      toEmbed.push({ index: i, text: chunks[i] });
    }
  }

  if (toEmbed.length === 0) return results;

  console.log(`🧠 Embedding ${toEmbed.length} MISSES via Gemini (${EMBEDDING_MODEL})...`);

  // 2. Embed missing chunks in batches of 100
  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  for (let i = 0; i < toEmbed.length; i += 100) {
    const slice = toEmbed.slice(i, i + 100);
    const batchResult = await model.batchEmbedContents({
      requests: slice.map((item) => ({
        content: { role: 'user', parts: [{ text: item.text }] },
      })),
    });

    // 3. Store results and update cache
    for (let j = 0; j < slice.length; j++) {
      const embedding = batchResult.embeddings[j].values;
      const originalIndex = slice[j].index;
      results[originalIndex] = embedding;
      
      const hash = getHash(slice[j].text);
      await setMemory(`embed:${hash}`, embedding, CACHE_TTL);
    }
  }

  return results;
}

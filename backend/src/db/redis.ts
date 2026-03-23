import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

// Loading env variables
dotenv.config();

/**
 * Configure the Upstash Redis client.
 * Using REST_URL and REST_TOKEN for the Upstash SDK's default behavior.
 */
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Stores a value in Redis with optional TTL (in seconds)
 */
export async function setMemory(key: string, value: any, ttlSeconds: number = 3600) {
  try {
    const data = typeof value === 'string' ? value : JSON.stringify(value);
    await redis.set(`research:${key}`, data, { ex: ttlSeconds });
    return true;
  } catch (err) {
    console.error('Redis setMemory error:', err);
    return false;
  }
}

/**
 * Retrieves a value from Redis
 */
export async function getMemory(key: string) {
  try {
    const res = await redis.get(`research:${key}`);
    
    // Attempt parsing as JSON if it's a string that looks like an object
    if (typeof res === 'string') {
      try {
        return JSON.parse(res);
      } catch {
        return res;
      }
    }
    return res;
  } catch (err) {
    console.error('Redis getMemory error:', err);
    return null;
  }
}

/**
 * Deletes a memory key
 */
export async function deleteMemory(key: string) {
  try {
    await redis.del(`research:${key}`);
    return true;
  } catch (err) {
    console.error('Redis deleteMemory error:', err);
    return false;
  }
}

/**
 * Simple rate limiter using sliding window logic
 */
export async function setRateLimit(clientId: string, limit: number, windowSeconds: number) {
  try {
    const key = `rate_limit:${clientId}`;
    const count = await redis.incr(key);
    
    if (count === 1) {
      // Set expiration for first request
      await redis.expire(key, windowSeconds);
    }
    
    return count <= limit;
  } catch (err) {
    console.error('Redis rate limit error:', err);
    return true; // fail-open in case of redis error
  }
}

export default redis;

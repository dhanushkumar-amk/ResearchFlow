import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';
import { query } from './postgres';

const isAuthKey = (key: string) => /^(temp_user|otp|reset_otp|change_pwd_otp):/.test(key);
let authTableReady: Promise<any> | undefined;
function ensureAuthTable() {
  if (!authTableReady) {
    authTableReady = query(`CREATE TABLE IF NOT EXISTS auth_ephemeral (
      key TEXT PRIMARY KEY, value JSONB NOT NULL, expires_at TIMESTAMPTZ NOT NULL
    )`).catch(error => { authTableReady = undefined; throw error; });
  }
  return authTableReady;
}

// Loading env variables
dotenv.config();

/**
 * Configure the Upstash Redis client.
 * Using REST_URL and REST_TOKEN for the Upstash SDK's default behavior.
 */
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redisConfigured = Boolean(redisUrl && redisToken);
const redis = redisConfigured ? new Redis({ url: redisUrl!, token: redisToken! }) : null;

// Keep local development usable without an Upstash account. Values live only
// in this backend process and disappear when it restarts.
const localMemory = new Map<string, { value: string; expiresAt: number }>();

function getLocalValue(key: string) {
  const entry = localMemory.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    localMemory.delete(key);
    return null;
  }
  return entry.value;
}

/**
 * Stores a value in Redis with optional TTL (in seconds)
 */
export async function setMemory(key: string, value: any, ttlSeconds: number = 3600) {
  if (isAuthKey(key)) {
    await ensureAuthTable();
    await query('INSERT INTO auth_ephemeral (key, value, expires_at) VALUES ($1, $2::jsonb, NOW() + $3 * INTERVAL \'1 second\') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, expires_at = EXCLUDED.expires_at', [key, JSON.stringify(value), ttlSeconds]);
    return true;
  }
  const data = typeof value === 'string' ? value : JSON.stringify(value);
  if (!redis) {
    localMemory.set(`research:${key}`, { value: data, expiresAt: Date.now() + ttlSeconds * 1000 });
    return true;
  }

  try {
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
  if (isAuthKey(key)) {
    await ensureAuthTable();
    const result = await query('SELECT value FROM auth_ephemeral WHERE key = $1 AND expires_at > NOW()', [key]);
    return result.rows[0]?.value ?? null;
  }
  if (!redis) {
    const res = getLocalValue(`research:${key}`);
    if (typeof res === 'string') {
      try {
        const trimmed = res.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) return JSON.parse(trimmed);
      } catch {
        // Return the original string for non-JSON values.
      }
    }
    return res;
  }

  try {
    const res = await redis.get(`research:${key}`);
    
    // Attempt parsing as JSON if it's a string that looks like an object or array
    if (typeof res === 'string') {
      try {
        const trimmed = res.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          return JSON.parse(trimmed);
        }
        return res;
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
  if (isAuthKey(key)) {
    await ensureAuthTable();
    await query('DELETE FROM auth_ephemeral WHERE key = $1', [key]);
    return true;
  }
  if (!redis) {
    localMemory.delete(`research:${key}`);
    return true;
  }

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
  if (!redis) {
    const key = `rate_limit:${clientId}`;
    const current = getLocalValue(key);
    const count = current ? Number(current) + 1 : 1;
    localMemory.set(key, {
      value: String(count),
      expiresAt: current ? localMemory.get(key)!.expiresAt : Date.now() + windowSeconds * 1000,
    });
    return count <= limit;
  }

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

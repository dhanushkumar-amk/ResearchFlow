import { Pool } from 'pg';
import dotenv from 'dotenv';
import dns from 'dns';

// Load environment variables
dotenv.config();

// Fix transient DNS resolution issues on Windows/Node.js by preferring IPv4
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const isNeon = process.env.DATABASE_URL?.includes('neon.tech');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Adjusted for high-speed multi-agent concurrency
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000, // 15 seconds to allow serverless cold starts
  ssl: isNeon ? { rejectUnauthorized: false } : undefined,
});

// Check connectivity
pool.on('connect', () => {
  console.log('Successfully connected to the PostgreSQL database!');
});

// Gracefully handle idle client errors without crashing the entire server
pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', err.message || err);
});

/**
 * Execute a query with a built-in retry mechanism for transient network or DNS errors.
 */
export const query = async (text: string, params?: any[], retries = 3, delay = 1000): Promise<any> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await pool.query(text, params);
    } catch (err: any) {
      const isNetworkError = 
        err.code === 'ENOTFOUND' || 
        err.code === 'ECONNRESET' || 
        err.code === 'ETIMEDOUT' || 
        err.code === 'EPIPE' ||
        err.message?.includes('getaddrinfo') ||
        err.message?.includes('connection timeout');

      if (isNetworkError && attempt < retries) {
        console.warn(
          `⚠️ [Database] Connection attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      throw err;
    }
  }
};

export default pool;

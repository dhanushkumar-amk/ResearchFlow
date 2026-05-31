import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;

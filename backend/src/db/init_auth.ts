import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import dns from 'dns';
dotenv.config();

// Custom lookup function that forces IPv4 to avoid broken IPv6 TLS handshake hangs on Windows/Wi-Fi
const lookupIPv4 = (hostname: string, options: any, callback: any) => {
  dns.lookup(hostname, { family: 4 }, (err, address, family) => {
    callback(err, address, family);
  });
};

async function check() {
  const isNeon = process.env.DATABASE_URL?.includes('neon.tech');
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL,
    ssl: isNeon ? { rejectUnauthorized: false } : undefined,
    lookup: lookupIPv4
  } as any);
  try {
    const res = await pool.query("SELECT to_regclass('public.users')");
    console.log('Result:', res.rows[0]);
    if (!res.rows[0].to_regclass) {
      console.log('Table "users" does not exist. Creating...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          avatar_url TEXT,
          details TEXT,
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Table created.');
    } else {
      console.log('Table "users" exists.');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

check();

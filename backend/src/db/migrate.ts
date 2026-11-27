import { query } from './postgres';
import fs from 'fs';
import path from 'path';

async function migrate() {
  try {
    console.log('Running migration...');
    // Initialize tables before adding columns on a fresh database.
    await query(fs.readFileSync(path.resolve(__dirname, '../../src/db/schema.sql'), 'utf8'));
    await query("ALTER TABLE agent_logs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'success'");
    await query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS web_context TEXT;', []);
    await query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS rag_context TEXT;', []);
    await query('ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;', []);
    await query('ALTER TABLE sessions ADD COLUMN IF NOT EXISTS search_meta JSONB DEFAULT \'{}\';', []);
    await query('ALTER TABLE documents ADD COLUMN IF NOT EXISTS s3_url TEXT;', []);
    await query('ALTER TABLE documents ADD COLUMN IF NOT EXISTS s3_key TEXT;', []);
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;', []);
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS details TEXT;', []);
    await query('ALTER TABLE users ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT \'{}\';', []);
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();

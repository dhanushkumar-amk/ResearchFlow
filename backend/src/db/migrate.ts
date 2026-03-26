import { query } from './postgres';

async function migrate() {
  try {
    console.log('Running migration...');
    await query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS web_context TEXT;', []);
    await query('ALTER TABLE reports ADD COLUMN IF NOT EXISTS rag_context TEXT;', []);
    await query('ALTER TABLE sessions ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;', []);
    await query('ALTER TABLE sessions ADD COLUMN IF NOT EXISTS search_meta JSONB DEFAULT \'{}\';', []);
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();

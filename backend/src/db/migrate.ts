import fs from 'fs';
import path from 'path';
import { query } from './postgres';
import dotenv from 'dotenv';

// Ensuring envs are loaded
dotenv.config();

async function migrate() {
  try {
    console.log('--- Starting Database Migration ---');
    const sqlPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL by semicolons to execute statements individually if needed, 
    // but pg.query can execute multiple statements separated by semicolons in one go.
    await query(schemaSql);
    
    console.log('Migration successful: All 4 tables and indexes created/verified.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migrate();

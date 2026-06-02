import { query } from '../db/postgres';
import dotenv from 'dotenv';
dotenv.config();

async function readAll() {
  try {
    const res = await query('SELECT session_id, content FROM reports');
    console.log(`Found ${res.rows.length} reports.`);
    for (const row of res.rows) {
      const content = row.content;
      const regex = /```mermaid([\s\S]*?)```/g;
      let match;
      let count = 0;
      while ((match = regex.exec(content)) !== null) {
        count++;
        console.log(`\n=== SESSION: ${row.session_id} | BLOCK #${count} ===`);
        console.log(match[1].trim());
        console.log('====================================');
      }
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

readAll();

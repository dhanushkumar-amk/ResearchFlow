import { query } from '../db/postgres';
import dotenv from 'dotenv';
dotenv.config();

async function read() {
  const sessionId = 'fbd6bbfd-3cd3-4863-b49d-3dee92217623';
  try {
    const res = await query('SELECT content FROM reports WHERE session_id = $1', [sessionId]);
    if (res.rows.length === 0) {
      console.log('Report not found');
      return;
    }
    const content = res.rows[0].content;
    console.log('--- REPORT CONTENT LENGTH:', content.length);
    
    // Find all mermaid blocks
    const regex = /```mermaid([\s\S]*?)```/g;
    let match;
    let count = 0;
    while ((match = regex.exec(content)) !== null) {
      count++;
      console.log(`\n--- MERMAID BLOCK #${count} ---`);
      console.log(match[1]);
      console.log('---------------------------');
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

read();

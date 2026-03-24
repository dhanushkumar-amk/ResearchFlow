import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'documents'");
  console.log('Columns in documents table:', res.rows.map(r => r.column_name));
  await client.end();
}
main().catch(console.error);

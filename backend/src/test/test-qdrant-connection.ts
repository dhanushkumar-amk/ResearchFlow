import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function diagnose() {
  const url = process.env.QDRANT_URL;
  const apiKey = process.env.QDRANT_API_KEY;

  console.log('🔍 Diagnosing Qdrant Connection...');
  console.log('URL:', url);
  console.log('API Key defined:', !!apiKey);

  const client = new QdrantClient({
    url: url,
    apiKey: apiKey,
    port: 443,
    checkCompatibility: false,
  });

  try {
    console.log('📡 Calling getCollections() on port 443...');
    const cols = await client.getCollections();
    console.log('✅ Collections response:', cols);
  } catch (err: any) {
    console.error('❌ Diagnostic Failed on port 443:', err.message);
    console.error('Full Error:', err);
  }
}

diagnose();

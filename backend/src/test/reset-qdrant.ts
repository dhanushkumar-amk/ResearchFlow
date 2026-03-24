import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config';

const client = new QdrantClient({ 
  url: config.qdrantUrl, 
  apiKey: config.qdrantApiKey 
});

async function reset() {
  await client.deleteCollection('research_test_transformer');
  console.log('🗑️  Collection research_test_transformer deleted.');
}

reset();

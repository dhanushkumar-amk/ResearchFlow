import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config';

// Initialize Qdrant Client
export const qdrantClient = new QdrantClient({
  url: config.qdrantUrl,
  apiKey: config.qdrantApiKey,
});

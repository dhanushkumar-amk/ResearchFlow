import dotenv from 'dotenv';
import path from 'path';

// Load .env at the very beginning
dotenv.config();

const requiredEnvVars = [
  'GROQ_API_KEY',
  'GOOGLE_API_KEY',
  'TAVILY_API_KEY',
  'QDRANT_URL',
  'QDRANT_API_KEY',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'DATABASE_URL'
];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`❌ Missing required environment variable: ${key}. Check your .env file.`);
  }
});

export const config = {
  port: process.env.PORT || 3001,
  groqApiKey: process.env.GROQ_API_KEY as string,
  googleApiKey: process.env.GOOGLE_API_KEY as string,
  tavilyApiKey: process.env.TAVILY_API_KEY as string,
  qdrantUrl: process.env.QDRANT_URL as string,
  qdrantApiKey: process.env.QDRANT_API_KEY as string,
  redisUrl: process.env.UPSTASH_REDIS_REST_URL as string,
  redisToken: process.env.UPSTASH_REDIS_REST_TOKEN as string,
  databaseUrl: process.env.DATABASE_URL as string
};

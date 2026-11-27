import dotenv from 'dotenv';
import path from 'path';

// Load .env at the very beginning
dotenv.config();

export const config = {
  // Keep the API and health endpoint available when optional integrations are
  // not configured. Routes that need these services will report their own errors.
  jwtSecret: process.env.JWT_SECRET || 'development-only-change-me',
  port: process.env.PORT || 3001,
  groqApiKey: process.env.GROQ_API_KEY || '',
  googleApiKey: process.env.GOOGLE_API_KEY || '',
  tavilyApiKey: process.env.TAVILY_API_KEY || '',
  qdrantUrl: process.env.QDRANT_URL || '',
  qdrantApiKey: process.env.QDRANT_API_KEY || '',
  redisUrl: process.env.UPSTASH_REDIS_REST_URL || '',
  redisToken: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  databaseUrl: process.env.DATABASE_URL || '',
  newsApiKey: process.env.NEWS_API_KEY as string,
  pubmedEmail: process.env.PUBMED_EMAIL as string,
  redditUserAgent: process.env.REDDIT_USER_AGENT as string
};

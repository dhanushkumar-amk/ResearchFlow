import { Router, Request, Response } from 'express';
import { config } from '../config';

const router = Router();

/**
 * GET /api/health
 * Returns system health info.
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    configured: {
      database: Boolean(config.databaseUrl),
      groq: Boolean(config.groqApiKey),
      google: Boolean(config.googleApiKey),
      tavily: Boolean(config.tavilyApiKey),
      qdrant: Boolean(config.qdrantUrl && config.qdrantApiKey),
      redis: Boolean(config.redisUrl && config.redisToken),
    },
    uptime: Math.floor(process.uptime()),
    version: '1.0.0'
  });
});

export default router;

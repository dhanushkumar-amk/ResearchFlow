import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/health
 * Returns system health info.
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    version: '1.0.0'
  });
});

export default router;

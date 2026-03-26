import { Router, Response } from 'express';
import { query } from '../db/postgres';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/admin/logs
 * Returns the last 100 agent activity logs.
 */
router.get('/logs', requireAuth, async (req: AuthRequest, res: Response) => {
  // In a real app, you'd check if the user has an 'admin' role.
  // For this beginner-friendly approach, we'll assume auth is enough for now.
  try {
    const text = `
      SELECT * FROM agent_logs
      ORDER BY created_at DESC
      LIMIT 100
    `;
    const result = await query(text);
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

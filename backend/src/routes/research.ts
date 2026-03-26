import { Router, Request, Response } from 'express';
import {
  createSession,
  updateSessionStatus,
  saveReport,
  getResearchHistory,
  getSessionReport,
  deleteSession,
  getAllResearchHistory,
  toggleSessionPublic,
  getPublicSessionReport
} from '../db/queries';
import { researchGraph } from '../graph/researchGraph';
import { researchEmitter } from '../events/emitter';
import { researchRateLimiter } from '../middleware/rateLimit';
import { validateResearchQuery } from '../middleware/validation';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { runChatAgent } from '../agents/chat';

const router = Router();

/**
 * In-memory map to store active SSE connections.
 */
const clients = new Map<string, Response>();

/**
 * Helper to format and send SSE events.
 */
function sendSSE(res: Response, event: string, data: any) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/**
 * POST /api/research
 * Starts a new research process.
 */
router.post('/', requireAuth, validateResearchQuery, researchRateLimiter, async (req: AuthRequest, res: Response) => {
  const { query, sessionId: manualSessionId } = req.body;
  const userId = req.userId!;

  try {
    const session = await createSession(userId, query, manualSessionId);
    const sessionId = session.session_id;

    res.json({ sessionId, message: 'Research started' });

    // Trigger background process - USING .invoke() for LangGraph
    researchGraph.invoke({ sessionId, query, userId }).catch((err: any) => {
      console.error(`❌ [Research Error] ${sessionId}:`, err);
      updateSessionStatus(sessionId, 'failed').catch(() => {});
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/research/:sessionId/stream
 * SSE endpoint for real-time updates.
 */
router.get('/:sessionId/stream', requireAuth, async (req: AuthRequest, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const userId = req.userId!;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  clients.set(sessionId, res);

  // IMMEDIATELY send connection heartbeat and current state for zero-lag feeling
  sendSSE(res, 'connected', { sessionId, status: 'establishing_sync' });

  // Optimistic State Sync: If the report exists, send it immediately to avoid empty UI
  getSessionReport(sessionId, userId).then(session => {
    if (session) {
      if (session.query) sendSSE(res, 'plan', { plan: session.query });
      if (session.content) sendSSE(res, 'report', session.content);
    }
  }).catch(() => {});

  const onUpdate = (data: any) => {
    if (data.sessionId === sessionId) {
      sendSSE(res, 'update', data);
    }
  };

  const onComplete = (data: any) => {
    if (data.sessionId === sessionId) {
      sendSSE(res, 'complete', data);
      res.end();
    }
  };

  const onError = (data: any) => {
    if (data.sessionId === sessionId) {
      sendSSE(res, 'error', data);
      res.end();
    }
  };

  researchEmitter.on('update', onUpdate);
  researchEmitter.on('complete', onComplete);
  researchEmitter.on('error', onError);

  req.on('close', () => {
    clients.delete(sessionId);
    researchEmitter.off('update', onUpdate);
    researchEmitter.off('complete', onComplete);
    researchEmitter.off('error', onError);
  });
});

/**
 * GET /api/research/history
 */
router.get('/history', requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  try {
    const history = await getAllResearchHistory(userId);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/research/:sessionId
 */
router.delete('/:sessionId', requireAuth, async (req: AuthRequest, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const userId = req.userId!;

  try {
    await deleteSession(sessionId, userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/research/:sessionId
 * Retrieves the final result of a research session.
 */
router.get('/:sessionId', requireAuth, async (req: AuthRequest, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const userId = req.userId!;

  try {
    const report = await getSessionReport(sessionId, userId);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message }); 
  }
});

/**
 * PUT /api/research/:sessionId/public
 * Toggles public visibility for a session.
 */
router.put('/:sessionId/public', requireAuth, async (req: AuthRequest, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const { isPublic } = req.body;
  const userId = req.userId!;

  try {
    const updated = await toggleSessionPublic(sessionId, userId, !!isPublic);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/research/:sessionId/public
 * PUBLIC ROUTE: Retrieves a report for a shared session.
 */
router.get('/:sessionId/public', async (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;

  try {
    const report = await getPublicSessionReport(sessionId);
    if (!report) return res.status(404).json({ error: 'Public research not found or sharing is disabled' });
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/research/:sessionId/chat
 * Streams follow-up chat responses based on the session report and context.
 */
router.post('/:sessionId/chat', requireAuth, async (req: AuthRequest, res: Response) => {
  const sessionId = req.params.sessionId as string;
  const { query: chatQuery } = req.body;
  const userId = req.userId!;

  if (!chatQuery) return res.status(400).json({ error: 'Query is required' });

  try {
    const session = await getSessionReport(sessionId, userId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const chatStream = runChatAgent({
      query: chatQuery,
      report: session.content,
      context: {
        webResults: session.web_context || '',
        ragResults: session.rag_context || '',
      }
    });

    for await (const chunk of chatStream) {
      res.write(chunk);
    }

    res.end();
  } catch (error: any) {
    console.error(`❌ [Chat Error] ${sessionId}:`, error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Chat failed' });
    } else {
      res.end();
    }
  }
});

export default router;

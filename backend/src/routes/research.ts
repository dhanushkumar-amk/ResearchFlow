import { Router, Request, Response } from 'express';
import {
  createSession,
  updateSessionStatus,
  saveReport,
  getSessionReport,
  getOwnedResearchSession,
  deleteSession,
  getAllResearchHistory,
  toggleSessionPublic,
  getPublicSessionReport,
  getCachedReport
} from '../db/queries';
import { researchGraph } from '../graph/researchGraph';
import { emitResearchEvent, researchEmitter } from '../events/emitter';
import { researchRateLimiter } from '../middleware/rateLimit';
import { validateResearchQuery, checkGuardrailViolation } from '../middleware/validation';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { runChatAgent } from '../agents/chat';

const router = Router();

// The same limit applies to new graph executions and unfinished sessions left by older workers.
const RESEARCH_DEADLINE_MS = 8 * 60 * 1000;

function sessionStatus(session: { status: string; content?: string | null; created_at: string | Date }) {
  if (session.content != null) return 'complete';
  if (session.status === 'failed') return 'failed';
  if (Date.now() - new Date(session.created_at).getTime() >= RESEARCH_DEADLINE_MS) return 'interrupted';
  return session.status;
}


/**
 * Helper to format and send SSE events.
 */
function sendSSE(res: Response, event: string, data: any) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data ?? null)}\n\n`);
}

/**
 * POST /api/research
 * Starts a new research process.
 */
router.post('/', requireAuth, validateResearchQuery, researchRateLimiter, async (req: AuthRequest, res: Response) => {
  const { query, sessionId: manualSessionId } = req.body;
  const userId = req.userId!;

  try {
    // 1. PERFORMANCE: CHECK 24H CACHE FIRST
    const cached = await getCachedReport(query, userId);
    if (cached) {
      console.log(`⚡ [Cache Hit] Reusing intelligence for: "${query}"`);
      const session = await createSession(userId, query, manualSessionId);
      const sessionId = session.session_id as string;

      // Populate new session from cache
      await saveReport(sessionId, cached.content, cached.quality_score, 1, cached.sources, cached.web_context, cached.rag_context);
      await updateSessionStatus(sessionId, 'complete');

      return res.json({ sessionId, message: 'Research loaded from cache (⚡)', cached: true });
    }

    // 2. CACHE MISS: Start new graph
    const session = await createSession(userId, query, manualSessionId);
    const sessionId = session.session_id as string;

    res.json({ sessionId, message: 'Research started' });

    // Trigger background process - USING .invoke() for LangGraph
    const signal = AbortSignal.timeout(RESEARCH_DEADLINE_MS);
    researchGraph.invoke({ sessionId, query, userId }, { signal }).catch((err: any) => {
      console.error(`❌ [Research Error] ${sessionId}:`, err);
      updateSessionStatus(sessionId, 'failed')
        .catch(statusError => console.error('Failed to persist research status:', statusError))
        .finally(() => emitResearchEvent(sessionId, 'error', signal.aborted
          ? 'Research timed out.' : 'Research failed.'));
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
  const session = await getOwnedResearchSession(sessionId, userId);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  if (res.destroyed) return;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  sendSSE(res, 'connected', { sessionId, status: 'establishing_sync' });

  const onUpdate = (payload: any) => {
    if (payload.sessionId === sessionId) sendSSE(res, payload.type, payload.data);
  };

  const finish = (event: string, data: unknown) => {
    if (res.writableEnded || res.destroyed) return;
    sendSSE(res, event, data);
    res.end();
  };

  const onComplete = (payload: any) => {
    if (payload.sessionId === sessionId) finish('complete', payload.data);
  };

  const onError = (payload: any) => {
    if (payload.sessionId === sessionId) finish('error', payload.data);
  };

  researchEmitter.on('update', onUpdate);
  researchEmitter.on('complete', onComplete);
  researchEmitter.on('failed', onError);

  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 15000);
  res.on('close', () => {
    clearInterval(heartbeat);
    researchEmitter.off('update', onUpdate);
    researchEmitter.off('complete', onComplete);
    researchEmitter.off('failed', onError);
  });

  try {
    // Recheck after subscribing in case the job finished during authorization.
    const current = await getOwnedResearchSession(sessionId, userId);
    const status = current && sessionStatus(current);
    if (!current || status === 'failed' || status === 'interrupted') {
      finish('error', 'Research failed.');
    } else if (status === 'complete') {
      finish('complete', {
        report: current.content,
        score: current.quality_score,
        duration_seconds: current.duration_seconds,
        is_public: current.is_public,
      });
    }
  } catch (error) {
    console.error('Failed to load research stream state:', error);
    res.end();
  }
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
  const { sessionId } = req.params;
  const userId = req.userId!;

  try {
    await deleteSession(sessionId as string, userId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/research/:sessionId
 */
router.get('/:sessionId', requireAuth, async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  const userId = req.userId!;

  try {
    if (req.query.progress === '1') {
      res.set('Cache-Control', 'no-store');
      const session = await getOwnedResearchSession(sessionId as string, userId);
      if (!session) return res.status(404).json({ error: 'Session not found' });
      const { query, content, quality_score, duration_seconds, is_public } = session;
      return res.json({ status: sessionStatus(session), query, content, quality_score, duration_seconds, is_public });
    }

    const report = await getSessionReport(sessionId as string, userId);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message }); 
  }
});

/**
 * PUT /api/research/:sessionId/public
 */
router.put('/:sessionId/public', requireAuth, async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  const { isPublic } = req.body;
  const userId = req.userId!;

  try {
    const updated = await toggleSessionPublic(sessionId as string, userId, !!isPublic);
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/research/:sessionId/public
 */
router.get('/:sessionId/public', async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  try {
    const report = await getPublicSessionReport(sessionId as string);
    if (!report) return res.status(404).json({ error: 'Public research not found' });
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/research/:sessionId/chat
 */
router.post('/:sessionId/chat', requireAuth, async (req: AuthRequest, res: Response) => {
  const { sessionId } = req.params;
  const { query: chatQuery } = req.body;
  const userId = req.userId!;

  if (typeof chatQuery !== 'string' || !chatQuery.trim()) return res.status(400).json({ error: 'Query is required' });

  // Security Guardrails check for chat inputs
  const violationError = checkGuardrailViolation(chatQuery);
  if (violationError) {
    console.warn(`🛡️ [Guardrails] Security block on chat input: "${chatQuery}"`);
    return res.status(400).json({ error: violationError });
  }

  try {
    const session = await getSessionReport(sessionId as string, userId);
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

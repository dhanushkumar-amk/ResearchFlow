import { Router, Request, Response } from 'express';
import { 
  createSession, 
  updateSessionStatus, 
  saveReport, 
  getResearchHistory, 
  getSessionReport, 
  deleteSession,
  getAllResearchHistory 
} from '../db/queries';
import { researchGraph } from '../graph/researchGraph';
import { researchEmitter } from '../events/emitter';
import { researchRateLimiter } from '../middleware/rateLimit';
import { validateResearchQuery } from '../middleware/validation';
import { AuthRequest } from '../middleware/auth';

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
  // If compression is used, we need to flush
  if ((res as any).flush) {
    (res as any).flush();
  }
}

/**
 * Mapping LangGraph nodes to user-friendly messages for Phase 32.
 */
const NODE_USER_MESSAGES: Record<string, string> = {
  planner: '🧠 Planning your research...',
  researcher: '🔍 Searching the web...',
  rag: '📄 Searching documents...',
  synthesizer: '✍️ Writing report...',
  critic: '⭐ Reviewing quality...',
};

/**
 * Execute the research graph and pipe results to emitter.
 */
async function executeResearch(query: string, sessionId: string, userId?: string) {
  console.log(`🚀 [Graph] Starting execution for: ${sessionId} (User: ${userId})`);

  try {
    const initialState = {
      query,
      sessionId,
      userId: userId || 'anonymous',
      retryCount: 0,
      status: 'initialized',
    };

    const stream = await researchGraph.stream(initialState, {
      streamMode: 'updates',
    });

    // MARK: DB Persistence - Start Session
    await updateSessionStatus(sessionId, 'planning');

    let fullState: any = { ...initialState };

    for await (const update of stream) {
      const nodeName = Object.keys(update)[0];
      // Merge the node's output into our full state
      const nodeData = (update as any)[nodeName];
      fullState = { ...fullState, ...nodeData };
      
      const message = NODE_USER_MESSAGES[nodeName] || `Working on ${nodeName}...`;
      console.log(`📡 [Graph Update] ${nodeName} -> ${message}`);

      // Emit status event
      researchEmitter.emit(`research:${sessionId}`, {
        type: 'status',
        data: { node: nodeName, message },
      });

      // MARK: DB Persistence - Update Status
      await updateSessionStatus(sessionId, nodeName);
    }

    researchEmitter.emit(`research:${sessionId}`, {
      type: 'complete',
      data: { 
        report: fullState.report || 'Report synthesis finished.', 
        score: fullState.critique?.score 
      },
    });

    // MARK: DB Persistence - Save Report
    if (fullState.report) {
      await saveReport(
        sessionId, 
        fullState.report, 
        fullState.critique?.score || 0, 
        0, 
        fullState.sources || []
      );
      await updateSessionStatus(sessionId, 'complete');
    }

  } catch (error: any) {
    console.error(`❌ [Graph Error] ${sessionId}:`, error.message);
    researchEmitter.emit(`research:${sessionId}`, {
      type: 'error',
      data: { message: error.message },
    });
  }
}

/**
 * POST /api/research/start
 * Initiates the research pipeline.
 */
router.post('/start', researchRateLimiter, validateResearchQuery, async (req: AuthRequest, res: Response) => {
  console.log('📦 [POST /start] Body:', req.body);
  const { query, sessionId } = req.body;

  if (!query || !sessionId) {
    return res.status(400).json({ error: 'query and sessionId are required' });
  }

  // MARK: DB Persistence - Initialize Session Record
  try {
    const userId = req.userId!;
    await createSession(userId, query, sessionId);
    
    // Trigger asynchronously
    executeResearch(query, sessionId, userId);
    res.json({ message: 'Research started', sessionId });
  } catch (err: any) {
    console.error('Failed to init session in DB:', err.message);
    res.status(500).json({ error: 'Database initialization failed' });
  }
});

/**
 * GET /api/research/:sessionId/stream
 * Connects the client to the live event bus.
 */
router.get('/:sessionId/stream', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  const eventHandler = (event: { type: string; data: any }) => {
    sendSSE(res, event.type, event.data);
  };

  const eventName = `research:${sessionId}`;
  researchEmitter.on(eventName, eventHandler);

  clients.set(sessionId, res);
  sendSSE(res, 'connected', { sessionId, timestamp: new Date() });

  req.on('close', () => {
    researchEmitter.off(eventName, eventHandler);
    clients.delete(sessionId);
    console.log(`🔌 [SSE] Client disconnected: ${sessionId}`);
  });
});

/**
 * GET /api/research/history
 * Returns the research history for a user.
 */
router.get('/history', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  try {
    const history = await getAllResearchHistory(userId);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/research/:sessionId
 * Retrieves the saved report for a specific session.
 */
router.get('/:sessionId', async (req: AuthRequest, res: Response) => {
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
 * DELETE /api/research/:sessionId
 * Deletes a session and its associated data.
 */
router.delete('/:sessionId', async (req: AuthRequest, res: Response) => {
  const sessionId = req.params.sessionId;
  const userId = req.userId!;

  try {
    await deleteSession(sessionId as string, userId);
    res.json({ message: 'Session deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

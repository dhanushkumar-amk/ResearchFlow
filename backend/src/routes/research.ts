import { Router, Request, Response } from 'express';
import { researchGraph } from '../graph/researchGraph';
import { researchEmitter } from '../events/emitter';
import { researchRateLimiter } from '../middleware/rateLimit';
import { validateResearchQuery } from '../middleware/validation';

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
async function executeResearch(query: string, sessionId: string) {
  console.log(`🚀 [Graph] Starting execution for: ${sessionId}`);

  try {
    const initialState = {
      query,
      sessionId,
      retryCount: 0,
      status: 'initialized',
    };

    const stream = await researchGraph.stream(initialState, {
      streamMode: 'updates',
    });

    let lastUpdate: any = {};

    for await (const update of stream) {
      lastUpdate = update;
      const nodeName = Object.keys(update)[0];
      const message = NODE_USER_MESSAGES[nodeName] || `Working on ${nodeName}...`;

      console.log(`📡 [Graph Update] ${nodeName} -> ${message}`);

      // Emit status event
      researchEmitter.emit(`research:${sessionId}`, {
        type: 'status',
        data: { node: nodeName, message },
      });
    }

    // Capture the final state from the last node update
    const finalNodeName = Object.keys(lastUpdate)[0];
    const finalData = lastUpdate[finalNodeName];

    researchEmitter.emit(`research:${sessionId}`, {
      type: 'complete',
      data: { 
        report: finalData?.report || 'Report synthesis finished.', 
        score: finalData?.critique?.score 
      },
    });

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
router.post('/start', researchRateLimiter, validateResearchQuery, (req: Request, res: Response) => {
  console.log('📦 [POST /start] Body:', req.body);
  const { query, sessionId } = req.body;

  if (!query || !sessionId) {
    return res.status(400).json({ error: 'query and sessionId are required' });
  }

  // Trigger asynchronously
  executeResearch(query, sessionId);

  res.json({ message: 'Research started', sessionId });
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

export default router;

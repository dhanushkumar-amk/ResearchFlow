import { Router, Request, Response } from 'express';

const router = Router();

/**
 * In-memory map to store active SSE connections.
 * In production, you'd use a more robust pub/sub system.
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
 * Phase 31: POST /api/research/start
 * Starts the research flow logic for a given session.
 */
router.post('/start', (req: Request, res: Response) => {
  const { query, sessionId } = req.body;

  if (!query || !sessionId) {
    return res.status(400).json({ error: 'query and sessionId are required' });
  }

  console.log(`📡 [API] Start research: ${sessionId} for query: ${query}`);

  // We immediately respond that it started. 
  // Node logic will follow in Phase 32.
  res.json({ message: 'Research started', sessionId });

  // Later: call the researchGraph.invoke(...) here and pipe results to clients.get(sessionId)
});

/**
 * Phase 31: GET /api/research/:sessionId/stream
 * Opens an SSE connection for real-time progress updates.
 */
router.get('/:sessionId/stream', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId as string;

  console.log(`🔌 [SSE] New connection request: ${sessionId}`);

  // SSE Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*', // Crucial for frontend
  });

  clients.set(sessionId, res);

  // Send initial "connected" event
  sendSSE(res, 'connected', { timestamp: new Date(), message: 'Stream active' });

  // Periodically send a heartbeat test event (as requested in Phase 31 instructions)
  const intervalId = setInterval(() => {
    sendSSE(res, 'update', { 
      status: 'heartbeat', 
      payload: 'Keep-alive test data from server' 
    });
  }, 2000);

  // Clean up on disconnect
  req.on('close', () => {
    console.log(`🔌 [SSE] Connection closed: ${sessionId}`);
    clearInterval(intervalId);
    clients.delete(sessionId);
  });
});

export default router;

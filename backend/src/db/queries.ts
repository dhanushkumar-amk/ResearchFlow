import { query } from './postgres';

/**
 * Creates a new research session
 */
export async function createSession(userId: string | null, userQuery: string) {
  const text = `
    INSERT INTO sessions (user_id, query, status)
    VALUES ($1, $2, 'pending')
    RETURNING *
  `;
  const res = await query(text, [userId, userQuery]);
  return res.rows[0];
}

/**
 * Updates the status of an existing session
 */
export async function updateSessionStatus(sessionId: string, status: string) {
  const text = `
    UPDATE sessions
    SET status = $2, 
        completed_at = CASE WHEN $2 IN ('complete', 'failed') THEN CURRENT_TIMESTAMP ELSE completed_at END
    WHERE session_id = $1
    RETURNING *
  `;
  const res = await query(text, [sessionId, status]);
  return res.rows[0];
}

/**
 * Saves the final research report
 */
export async function saveReport(sessionId: string, content: string, qualityScore: number, retryCount: number, sources: any[]) {
  const text = `
    INSERT INTO reports (session_id, content, quality_score, retry_count, sources)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const res = await query(text, [sessionId, content, qualityScore, retryCount, JSON.stringify(sources)]);
  return res.rows[0];
}

/**
 * Saves document metadata after processing
 */
export async function saveDocument(userId: string | null, filename: string, fileType: string, chunkCount: number, collectionName: string) {
  const text = `
    INSERT INTO documents (user_id, filename, file_type, chunk_count, qdrant_collection_name)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const res = await query(text, [userId, filename, fileType, chunkCount, collectionName]);
  return res.rows[0];
}

/**
 * Logs activity from a specific agent
 */
export async function logAgentActivity(
  sessionId: string, 
  agentName: string, 
  inputSummary: string, 
  outputSummary: string, 
  durationMs: number, 
  tokenCount: number
) {
  const text = `
    INSERT INTO agent_logs (session_id, agent_name, input_summary, output_summary, duration_ms, token_count)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
  const res = await query(text, [sessionId, agentName, inputSummary, outputSummary, durationMs, tokenCount]);
  return res.rows[0];
}

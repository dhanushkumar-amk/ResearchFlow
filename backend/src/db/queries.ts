import { query } from './postgres';

/**
 * Creates a new research session with an optional manual sessionId
 */
export async function createSession(userId: string | null, userQuery: string, sessionId?: string) {
  const queryText = sessionId 
    ? `INSERT INTO sessions (session_id, user_id, query, status) VALUES ($1, $2, $3, 'pending') RETURNING *`
    : `INSERT INTO sessions (user_id, query, status) VALUES ($1, $2, 'pending') RETURNING *`;
    
  const params = sessionId ? [sessionId, userId, userQuery] : [userId, userQuery];
  const res = await query(queryText, params);
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

/**
 * Retrieves all document metadata for a user session
 */
export async function getDocumentsByUserId(userId: string) {
  const text = `
    SELECT * FROM documents
    WHERE user_id = $1
    ORDER BY uploaded_at DESC
  `;
  const res = await query(text, [userId]);
  return res.rows;
}

/**
 * Deletes document metadata and returns its qdrant info for cleanup
 */
export async function deleteDocumentById(documentId: string) {
  const text = `
    DELETE FROM documents
    WHERE document_id = $1
    RETURNING *
  `;
  const res = await query(text, [documentId]);
  return res.rows[0];
}

/**
 * Retrieves research history with scores for a user
 */
export async function getResearchHistory(userId: string) {
  const text = `
    SELECT s.session_id, s.query, s.created_at, r.quality_score
    FROM sessions s
    LEFT JOIN reports r ON s.session_id = r.session_id
    WHERE s.user_id = $1
    ORDER BY s.created_at DESC
    LIMIT 5
  `;
  const res = await query(text, [userId]);
  return res.rows;
}

/**
 * Deletes a research session and all linked reports/logs
 */
export async function deleteSession(sessionId: string) {
  const text = `
    DELETE FROM sessions
    WHERE session_id = $1
    RETURNING *
  `;
  const res = await query(text, [sessionId]);
  return res.rows[0];
}

/**
 * Retrieves the full report for a specific session
 */
export async function getSessionReport(sessionId: string) {
  const text = `
    SELECT s.query, r.content, r.quality_score, r.sources, s.created_at
    FROM sessions s
    JOIN reports r ON s.session_id = r.session_id
    WHERE s.session_id = $1
  `;
  const res = await query(text, [sessionId]);
  return res.rows[0];
}

/**
 * Retrieves all research history for a user
 */
export async function getAllResearchHistory(userId: string) {
  const text = `
    SELECT s.session_id, s.query, s.status, s.created_at, r.quality_score
    FROM sessions s
    LEFT JOIN reports r ON s.session_id = r.session_id
    WHERE s.user_id = $1
    ORDER BY s.created_at DESC
  `;
  const res = await query(text, [userId]);
  return res.rows;
}


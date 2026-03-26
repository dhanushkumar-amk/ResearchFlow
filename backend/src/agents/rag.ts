import { callMcpTool } from '../mcp/toolClient';
import fs from 'fs/promises';
import path from 'path';

/**
 * Agent 3: RAG Agent - Phase 30 Updated
 * Task: Retrieve relevant context from the vector database via MCP Tool.
 * Now routes through the MCP server's document_search tool.
 */
import { logAgentActivity } from '../db/queries';

/**
 * Agent 3: RAG Agent - Phase 30 Updated
 * Task: Retrieve relevant context from the vector database via MCP Tool.
 * Now routes through the MCP server's document_search tool.
 */
export async function runRagAgent(query: string, collectionName: string, sessionId?: string) {
  const startTime = Date.now();
  console.log(`🤖 [RAG Agent] Starting retrieval via MCP Tool for: "${query}" in collection: "${collectionName}"`);

  let contextString = '';
  let status: 'success' | 'failure' = 'success';

  try {
    // ── CALLING MCP TOOL (Standardized Interface) ──────────────────────────
    const results = await callMcpTool('document_search', { 
      query, 
      collection_name: collectionName 
    });

    if (results.includes('No documents uploaded') || results.includes('No relevant information')) {
      contextString = '';
    } else {
      contextString = `Below is relevant context retrieved from the project knowledge base:\n\n${results}`;
    }
  } catch (err: any) {
    console.error(`❌ RAG Agent failed:`, err.message);
    status = 'failure';
  }

  const durationMs = Date.now() - startTime;

  // Database Performance Logging
  if (sessionId) {
    logAgentActivity(
      sessionId,
      'rag',
      query.substring(0, 500),
      contextString.substring(0, 500),
      durationMs,
      0, // Tool call, not direct LLM tokens
      status
    ).catch(() => {});
  }

  return {
    context: contextString,
    status
  };
}

import { callMcpTool } from '../mcp/toolClient';
import fs from 'fs/promises';
import path from 'path';

/**
 * Agent 3: RAG Agent - Phase 30 Updated
 * Task: Retrieve relevant context from the vector database via MCP Tool.
 * Now routes through the MCP server's document_search tool.
 */
export async function runRagAgent(query: string, collectionName: string) {
  const startTime = Date.now();
  console.log(`🤖 [RAG Agent] Starting retrieval via MCP Tool for: "${query}" in collection: "${collectionName}"`);

  let contextString = '';
  let status = 'success';

  try {
    // ── CALLING MCP TOOL (Standardized Interface) ──────────────────────────
    const results = await callMcpTool('document_search', { 
      query, 
      collection_name: collectionName 
    });

    if (results.includes('No documents uploaded') || results.includes('No relevant information')) {
      contextString = '';
      status = 'no_results';
    } else {
      contextString = `Below is relevant context retrieved from the project knowledge base:\n\n${results}`;
    }
  } catch (err: any) {
    console.error(`❌ RAG Agent failed:`, err.message);
    status = 'error';
  }

  const duration = Date.now() - startTime;

  // Log the agent session
  const logEntry = {
    agent: 'rag_mcp',
    query,
    collectionName,
    durationMs: duration,
    status,
    timestamp: new Date().toISOString()
  };

  try {
    const logsDir = path.join(process.cwd(), 'agent_logs');
    await fs.mkdir(logsDir, { recursive: true });
    await fs.appendFile(
      path.join(logsDir, 'rag_agent.log'),
      JSON.stringify(logEntry) + '\n'
    );
  } catch (logError: any) {
    console.warn('⚠️ Failed to write RAG agent log:', logError.message);
  }

  return {
    context: contextString,
    status
  };
}

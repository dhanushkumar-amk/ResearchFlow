import { callMcpTool } from '../mcp/toolClient';
import fs from 'fs/promises';
import path from 'path';

/**
 * Agent 1: Search Agent (Researcher) - Phase 30 Updated
 * Task: Execute optimized search queries via MCP Tool.
 * Now routes through the MCP server's web_search tool for standardization.
 */
export async function runSearchAgent(query: string) {
  const startTime = Date.now();
  console.log(`🔎 [Search Agent] Researching via MCP Tool: "${query}"`);

  try {
    // ── CALLING MCP TOOL (Standardized Interface) ──────────────────────────
    const formattedResults = await callMcpTool('web_search', { query });

    const duration = Date.now() - startTime;

    // Log the activity
    const logEntry = {
      agent: 'search_mcp',
      query,
      durationMs: duration,
      timestamp: new Date().toISOString()
    };

    const logsDir = path.join(process.cwd(), 'agent_logs');
    await fs.mkdir(logsDir, { recursive: true });
    await fs.appendFile(
      path.join(logsDir, 'search_agent.log'),
      JSON.stringify(logEntry) + '\n'
    );

    return formattedResults;
  } catch (error: any) {
    console.error(`❌ Search Agent (MCP) failed:`, error.message);
    return 'Web search failed due to an error.';
  }
}

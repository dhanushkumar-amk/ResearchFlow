import { callMcpTool } from '../mcp/toolClient';
import fs from 'fs/promises';
import path from 'path';

/**
 * Agent 1: Search Agent (Researcher) - Phase 30 Updated
 * Task: Execute optimized search queries via MCP Tool.
 * Now routes through the MCP server's web_search tool for standardization.
 */
import { config } from '../config';

import { logAgentActivity } from '../db/queries';

/**
 * Agent 2: Search Agent (Researcher) - HIGH SPEED EDITION
 * Task: Execute optimized search queries directly via Tavily API.
 */
export async function runSearchAgent(query: string, sessionId?: string) {
  const startTime = Date.now();
  console.log(`🔎 [Search Agent] Direct Researching: "${query}"`);

  let status: 'success' | 'failure' = 'success';
  let formattedResults = '';

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: config.tavilyApiKey,
        query: query,
        search_depth: 'basic',
        include_images: false,
        max_results: 5
      })
    });

    if (!response.ok) {
        status = 'failure';
        throw new Error(`Tavily error: ${response.statusText}`);
    }
    
    const data = await response.json();
    formattedResults = data.results.map((r: any) => `Source: ${r.url}\nTitle: ${r.title}\nContent: ${r.content}\n`).join('\n---\n');

    console.log(`✅ [Search Agent] Finished in ${Date.now() - startTime}ms`);
  } catch (error: any) {
    console.error(`❌ Search Agent failed:`, error.message);
    status = 'failure';
    formattedResults = 'Web search failed. Proceeding with internal knowledge only.';
  } finally {
    const durationMs = Date.now() - startTime;
    if (sessionId) {
      logAgentActivity(
        sessionId,
        'search',
        query.substring(0, 500),
        formattedResults.substring(0, 500),
        durationMs,
        0, // Set to 0 as it's an API call, not LLM tokens
        status
      ).catch(() => {});
    }
  }

  return formattedResults;
}

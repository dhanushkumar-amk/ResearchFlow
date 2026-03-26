import { callMcpTool } from '../mcp/toolClient';
import fs from 'fs/promises';
import path from 'path';

/**
 * Agent 1: Search Agent (Researcher) - Phase 30 Updated
 * Task: Execute optimized search queries via MCP Tool.
 * Now routes through the MCP server's web_search tool for standardization.
 */
import { config } from '../config';

/**
 * Agent 2: Search Agent (Researcher) - HIGH SPEED EDITION
 * Task: Execute optimized search queries directly via Tavily API.
 */
export async function runSearchAgent(query: string) {
  const startTime = Date.now();
  console.log(`🔎 [Search Agent] Direct Researching: "${query}"`);

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

    if (!response.ok) throw new Error(`Tavily error: ${response.statusText}`);
    
    const data = await response.json();
    const formattedResults = data.results.map((r: any) => `Source: ${r.url}\nTitle: ${r.title}\nContent: ${r.content}\n`).join('\n---\n');

    console.log(`✅ [Search Agent] Finished in ${Date.now() - startTime}ms`);
    return formattedResults;
  } catch (error: any) {
    console.error(`❌ Search Agent failed:`, error.message);
    return 'Web search failed. Proceeding with internal knowledge only.';
  }
}

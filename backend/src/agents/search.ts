import { searchWeb, SearchResult } from '../tools/tavilySearch';
import fs from 'fs/promises';
import path from 'path';

/**
 * Agent 1: Search Agent (Researcher)
 * Task: Execute optimized search queries and format results.
 */
export async function runSearchAgent(query: string) {
  const startTime = Date.now();
  console.log(`🔎 [Search Agent] Researching: "${query}"`);

  // We generate a list of queries (for now, just the main query + two variants)
  // In a real flow, the Planner provides these. 
  // To keep it robust, we'll search the main query + a focused query.
  const queries = [
    query,
    `${query} detailed analysis 2024`,
    `${query} scientific studies or news`
  ];

  try {
    const batchResults = await searchWeb(queries);
    
    // Flatten and deduplicate by URL
    const allResults: SearchResult[] = [];
    const seenUrls = new Set<string>();

    for (const batch of batchResults) {
      for (const item of batch) {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          allResults.push(item);
        }
      }
    }

    // Format as a text block for the synthesizer
    let formattedResults = '';
    allResults.slice(0, 10).forEach((res, i) => {
      formattedResults += `[${i + 1}] ${res.title}\nURL: ${res.url}\nSnippet: ${res.snippet}\n\n`;
    });

    const duration = Date.now() - startTime;

    // Log the activity
    const logEntry = {
      agent: 'search',
      query,
      resultsCount: allResults.length,
      durationMs: duration,
      timestamp: new Date().toISOString()
    };

    const logsDir = path.join(process.cwd(), 'agent_logs');
    await fs.mkdir(logsDir, { recursive: true });
    await fs.appendFile(
      path.join(logsDir, 'search_agent.log'),
      JSON.stringify(logEntry) + '\n'
    );

    return formattedResults || 'No web results found.';
  } catch (error: any) {
    console.error(`❌ Search Agent failed:`, error.message);
    return 'Web search failed due to an error.';
  }
}

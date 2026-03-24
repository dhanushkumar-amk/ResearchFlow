import { tavily } from '@tavily/core';
import { config } from '../config';

// Define the shape of a single search result
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  published_date?: string;
}

// Helper: sleep for a given number of milliseconds
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Initialize the Tavily client once
const tavilyClient = tavily({ apiKey: config.tavilyApiKey });

/**
 * Runs a single Tavily search query.
 * On 429 rate-limit error, waits 1 second and retries once automatically.
 */
async function runSingleQuery(query: string): Promise<SearchResult[]> {
  const doSearch = async () => {
    const response = await tavilyClient.search(query, {
      maxResults: 5,
      includeAnswer: true,
      includeRawContent: false,
    });
    return response.results.map((item: any) => ({
      title: item.title || 'No title',
      url: item.url || '',
      snippet: item.content || item.snippet || '',
      published_date: item.published_date || undefined,
    }));
  };

  try {
    return await doSearch();
  } catch (error: any) {
    // Handle 429 rate-limit: wait 1 second then retry once
    if (error?.status === 429 || error?.message?.includes('429')) {
      console.warn(`⚠️ Rate limit hit for "${query}". Waiting 1s and retrying...`);
      await sleep(1000);
      try {
        return await doSearch();
      } catch (retryError: any) {
        console.error(`❌ Retry also failed for "${query}":`, retryError.message);
        return [];
      }
    }
    console.error(`❌ Search failed for "${query}":`, error.message);
    return []; // Return empty so other parallel queries still succeed
  }
}

/**
 * Runs multiple search queries IN PARALLEL using Promise.all.
 * Returns an array of result arrays, one per input query.
 */
export async function searchWeb(queries: string[]): Promise<SearchResult[][]> {
  console.log(`🔎 Running ${queries.length} search queries in parallel...`);
  const results = await Promise.all(queries.map((q) => runSingleQuery(q)));
  return results;
}

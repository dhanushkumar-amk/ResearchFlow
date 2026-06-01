import { config } from '../config';
import { logAgentActivity } from '../db/queries';
import { 
  PubMedResult,
  ArXivResult,
  WikipediaResult,
  HackerNewsResult,
  RedditResult,
  GitHubResult,
  NewsResult,
  DuckDuckGoResult,
  YouTubeTranscriptResult
} from '../tools/mcpTools';
import { searchWeb } from '../tools/tavilySearch';
import { callMcpTool } from '../mcp/toolClient';

/**
 * Classify query into search categories for specialized tool routing
 */
function classifyQuery(query: string): string[] {
  const q = query.toLowerCase();
  
  if (q.includes('youtube.com') || q.includes('youtu.be')) {
    return ['youtube'];
  }

  const categories: string[] = [];

  if (
    q.includes('paper') || q.includes('study') || q.includes('arxiv') || q.includes('pubmed') ||
    q.includes('clinical') || q.includes('efficacy') || q.includes('research') || q.includes('journal') ||
    q.includes('science') || q.includes('physics') || q.includes('biology') || q.includes('treatment') ||
    q.includes('disease') || q.includes('drug') || q.includes('medical') || q.includes('theory') ||
    q.includes('algorithm') || q.includes('llm') || q.includes('gpt') || q.includes('quantization') ||
    q.includes('pruning') || q.includes('neuron') || q.includes('solid-state')
  ) {
    categories.push('academic');
  }

  if (
    q.includes('github') || q.includes('repo') || q.includes('code') || q.includes('library') ||
    q.includes('framework') || q.includes('programming') || q.includes('developer') || q.includes('rust') ||
    q.includes('python') || q.includes('typescript') || q.includes('npm') || q.includes('api') ||
    q.includes('git') || q.includes('build') || q.includes('software') || q.includes('open source')
  ) {
    categories.push('tech');
  }

  if (
    q.includes('reddit') || q.includes('hacker news') || q.includes('hn') || q.includes('forum') ||
    q.includes('opinion') || q.includes('review') || q.includes('people say') || q.includes('discussion') ||
    q.includes('thread') || q.includes('y combinator')
  ) {
    categories.push('social');
  }

  if (
    q.includes('news') || q.includes('recent') || q.includes('latest') || q.includes('2026') ||
    q.includes('breaking') || q.includes('announcement') || q.includes('market') || q.includes('startup') ||
    q.includes('commercial') || q.includes('trend') || q.includes('price') || q.includes('stock')
  ) {
    categories.push('news');
  }

  if (
    q.includes('wikipedia') || q.includes('what is') || q.includes('who is') || q.includes('define') ||
    q.includes('history of') || q.includes('concept') || q.includes('definition')
  ) {
    categories.push('knowledge');
  }

  if (categories.length === 0) {
    categories.push('web');
  }

  return categories;
}

/**
 * Agent 2: Search Agent (Researcher) - MULTI-TOOL PARALLEL SWARM
 * Task: Classifies query and runs specialized tools in parallel.
 */
export async function runSearchAgent(query: string, sessionId?: string): Promise<string> {
  const startTime = Date.now();
  console.log(`🔎 [Search Agent] Direct Researching: "${query}"`);

  const categories = classifyQuery(query);
  console.log(`🧭 [Search Agent] Routed to categories: ${categories.join(', ')}`);

  const promises: Promise<string>[] = [];

  // Dispatch parallel searches depending on categories
  for (const cat of categories) {
    if (cat === 'youtube') {
      promises.push(
        callMcpTool('youtube_transcript', { url: query }).then(resStr => {
          const res = JSON.parse(resStr) as YouTubeTranscriptResult[];
          if (res.length === 0) return '';
          return `=== YouTube Video Transcript ===\nTitle: ${res[0].video_title}\nSource: ${res[0].url}\nTranscript Excerpt:\n${res[0].transcript}\n`;
        })
      );
    }
    if (cat === 'academic') {
      promises.push(
        callMcpTool('arxiv_search', { query }).then(resStr => {
          const res = JSON.parse(resStr) as ArXivResult[];
          if (res.length === 0) return '';
          return `=== Academic Papers (ArXiv) ===\n` + res.map(r => `Title: ${r.title}\nAuthors: ${r.authors.join(', ')}\nDate: ${r.published_date}\nLink: ${r.url}\nAbstract: ${r.abstract}\n`).join('\n---\n');
        })
      );
      promises.push(
        callMcpTool('pubmed_search', { query }).then(resStr => {
          const res = JSON.parse(resStr) as PubMedResult[];
          if (res.length === 0) return '';
          return `=== Clinical & Medical Studies (PubMed) ===\n` + res.map(r => `Title: ${r.title}\nAuthors: ${r.authors.join(', ')}\nLink: ${r.url}\nAbstract: ${r.abstract}\n`).join('\n---\n');
        })
      );
    }
    if (cat === 'tech') {
      promises.push(
        callMcpTool('github_search', { query }).then(resStr => {
          const res = JSON.parse(resStr) as GitHubResult[];
          if (res.length === 0) return '';
          return `=== Code Repositories (GitHub) ===\n` + res.map(r => `Repo: ${r.name}\nStars: ${r.stars} ⭐ | Lang: ${r.language}\nLink: ${r.url}\nDescription: ${r.description}\n`).join('\n---\n');
        })
      );
      promises.push(
        searchWeb([query]).then(res => {
          const results = res[0] || [];
          if (results.length === 0) return '';
          return `=== Technical Web Articles (Tavily) ===\n` + results.map(r => `Title: ${r.title}\nSource: ${r.url}\nExcerpt: ${r.snippet}\n`).join('\n---\n');
        })
      );
    }
    if (cat === 'social') {
      promises.push(
        callMcpTool('hackernews_search', { query }).then(resStr => {
          const res = JSON.parse(resStr) as HackerNewsResult[];
          if (res.length === 0) return '';
          return `=== Tech Community Discussions (HackerNews) ===\n` + res.map(r => `Thread: ${r.title}\nPoints: ${r.points} | Comments: ${r.comments}\nLink: ${r.url}\nDate: ${r.date}\n`).join('\n---\n');
        })
      );
      promises.push(
        callMcpTool('reddit_search', { query }).then(resStr => {
          const res = JSON.parse(resStr) as RedditResult[];
          if (res.length === 0) return '';
          return `=== User Discussions (Reddit) ===\n` + res.map(r => `Post: ${r.title} | Subreddit: ${r.subreddit}\nUpvotes: ${r.score}\nLink: ${r.url}\nContent: ${r.content}\n`).join('\n---\n');
        })
      );
    }
    if (cat === 'news') {
      promises.push(
        callMcpTool('news_search', { query }).then(resStr => {
          const res = JSON.parse(resStr) as NewsResult[];
          if (res.length === 0) return '';
          return `=== Press & News Articles ===\n` + res.map(r => `Title: ${r.title}\nOutlet: ${r.source} | Date: ${r.date}\nLink: ${r.url}\nSummary: ${r.description}\n`).join('\n---\n');
        })
      );
    }
    if (cat === 'knowledge') {
      promises.push(
        callMcpTool('wikipedia_search', { query }).then(resStr => {
          const res = JSON.parse(resStr) as WikipediaResult[];
          if (res.length === 0) return '';
          return `=== Background Knowledge (Wikipedia) ===\n` + res.map(r => `Article: ${r.title}\nCategories: ${r.categories.join(', ')}\nLink: ${r.url}\nSummary: ${r.summary}\n`).join('\n---\n');
        })
      );
      promises.push(
        searchWeb([query]).then(res => {
          const results = res[0] || [];
          if (results.length === 0) return '';
          return `=== Search Web Context (Tavily) ===\n` + results.map(r => `Title: ${r.title}\nSource: ${r.url}\nExcerpt: ${r.snippet}\n`).join('\n---\n');
        })
      );
    }
    if (cat === 'web') {
      promises.push(
        searchWeb([query]).then(res => {
          const results = res[0] || [];
          if (results.length === 0) return '';
          return `=== Web Search (Tavily) ===\n` + results.map(r => `Title: ${r.title}\nSource: ${r.url}\nExcerpt: ${r.snippet}\n`).join('\n---\n');
        })
      );
      promises.push(
        callMcpTool('duckduckgo_search', { query }).then(resStr => {
          const res = JSON.parse(resStr) as DuckDuckGoResult[];
          if (res.length === 0) return '';
          return `=== Web Search (DuckDuckGo Fallback) ===\n` + res.map(r => `Title: ${r.title}\nLink: ${r.url}\nSnippet: ${r.body}\n`).join('\n---\n');
        })
      );
    }
  }

  let formattedResults = '';
  let status: 'success' | 'failure' = 'success';

  try {
    const results = await Promise.all(promises);
    formattedResults = results.filter(r => r.trim().length > 0).join('\n\n');
    
    if (formattedResults.trim().length === 0) {
      console.log('⚠️ Specialized tools returned no results. Running default Tavily search fallback...');
      const res = await searchWeb([query]);
      const resultsArray = res[0] || [];
      formattedResults = `=== Web Search (Tavily Fallback) ===\n` + resultsArray.map(r => `Title: ${r.title}\nSource: ${r.url}\nExcerpt: ${r.snippet}\n`).join('\n---\n');
    }
    
    console.log(`✅ [Search Agent] Multi-tool search completed in ${Date.now() - startTime}ms`);
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
        0,
        status
      ).catch(() => {});
    }
  }

  return formattedResults;
}

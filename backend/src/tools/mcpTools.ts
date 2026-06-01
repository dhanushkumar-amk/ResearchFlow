import axios from 'axios';
import { config } from '../config';
import { searchWeb } from './tavilySearch';

// --- TYPE DEFINITIONS ---

export interface PubMedResult {
  title: string;
  abstract: string;
  authors: string[];
  url: string;
}

export interface ArXivResult {
  title: string;
  authors: string[];
  abstract: string;
  url: string;
  published_date: string;
}

export interface WikipediaResult {
  title: string;
  summary: string;
  url: string;
  categories: string[];
}

export interface HackerNewsResult {
  title: string;
  url: string;
  points: number;
  comments: number;
  date: string;
}

export interface RedditResult {
  title: string;
  content: string;
  url: string;
  subreddit: string;
  score: number;
}

export interface GitHubResult {
  name: string;
  description: string;
  url: string;
  stars: number;
  language: string;
}

export interface NewsResult {
  title: string;
  description: string;
  url: string;
  source: string;
  date: string;
}

export interface DuckDuckGoResult {
  title: string;
  url: string;
  body: string;
}

export interface YouTubeTranscriptResult {
  transcript: string;
  video_title: string;
  url: string;
}

// --- TOOL IMPLEMENTATIONS ---

/**
 * PubMed Search: Query NCBI E-utilities.
 */
export async function pubmedSearch(query: string): Promise<PubMedResult[]> {
  const email = config.pubmedEmail || 'your@email.com';
  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=5&retmode=json&email=${encodeURIComponent(email)}`;
    const searchRes = await axios.get(searchUrl, { timeout: 5000 });
    const idList: string[] = searchRes.data?.esearchresult?.idlist || [];
    
    if (idList.length === 0) return [];

    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idList.join(',')}&retmode=json`;
    const summaryRes = await axios.get(summaryUrl, { timeout: 5000 });
    const results = summaryRes.data?.result || {};
    
    const output: PubMedResult[] = [];
    for (const id of idList) {
      const doc = results[id];
      if (!doc) continue;
      const title = doc.title || 'No Title Available';
      const abstract = doc.description || doc.abstract || 'No abstract available.';
      const authors = (doc.authors || []).map((a: any) => a.name);
      const url = `https://pubmed.ncbi.nlm.nih.gov/${id}/`;
      output.push({ title, abstract, authors, url });
    }
    return output;
  } catch (error: any) {
    console.error(`[PubMed Tool] Error:`, error.message);
    return [];
  }
}

/**
 * ArXiv Search: Query export.arxiv.org API.
 */
export async function arxivSearch(query: string): Promise<ArXivResult[]> {
  try {
    const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&max_results=5`;
    const headers = { 'User-Agent': 'ResearchFlow/1.0 (contact@researchflow.org)' };
    
    let res;
    let retries = 1;
    let delay = 1500;
    while (retries >= 0) {
      try {
        res = await axios.get(url, { headers, timeout: 5000 });
        break;
      } catch (err: any) {
        if ((err.response?.status === 429 || err.message?.includes('timeout')) && retries > 0) {
          retries--;
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        } else {
          throw err;
        }
      }
    }

    if (!res) return [];
    const xml = res.data as string;
    
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    const output: ArXivResult[] = [];
    let match;
    
    while ((match = entryRegex.exec(xml)) !== null) {
      const entryContent = match[1];
      
      const titleMatch = entryContent.match(/<title>([\s\S]*?)<\/title>/);
      const summaryMatch = entryContent.match(/<summary>([\s\S]*?)<\/summary>/);
      const idMatch = entryContent.match(/<id>([\s\S]*?)<\/id>/);
      const publishedMatch = entryContent.match(/<published>([\s\S]*?)<\/published>/);
      
      const authorRegex = /<author>\s*<name>([\s\S]*?)<\/name>\s*<\/author>/g;
      const authors: string[] = [];
      let authorMatch;
      while ((authorMatch = authorRegex.exec(entryContent)) !== null) {
        authors.push(authorMatch[1].trim());
      }
      
      const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : 'No Title';
      const abstract = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : 'No abstract available.';
      const paperUrl = idMatch ? idMatch[1].trim() : '';
      const publishedDate = publishedMatch ? publishedMatch[1].substring(0, 10) : 'Unknown Date';
      
      output.push({
        title,
        authors,
        abstract,
        url: paperUrl,
        published_date: publishedDate
      });
    }
    return output;
  } catch (error: any) {
    console.warn(`[ArXiv Tool] Failed: ${error.message}. Falling back to Tavily ArXiv search...`);
    try {
      const tavilyRes = await searchWeb([`site:arxiv.org ${query}`]);
      const resultsArray = tavilyRes[0] || [];
      return resultsArray.map(r => ({
        title: r.title,
        authors: ['ArXiv Contributor'],
        abstract: r.snippet,
        url: r.url,
        published_date: new Date().toISOString().substring(0, 10)
      }));
    } catch (e: any) {
      console.error(`[ArXiv Fallback Tool] Tavily fallback failed:`, e.message);
    }
    return [];
  }
}

/**
 * Wikipedia Search: Query Wikipedia's official Action API.
 */
export async function wikipediaSearch(query: string): Promise<WikipediaResult[]> {
  try {
    const headers = { 'User-Agent': 'ResearchFlow/1.0 (contact@researchflow.org)' };
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json`;
    const searchRes = await axios.get(searchUrl, { headers, timeout: 5000 });
    const searchResults = searchRes.data?.query?.search || [];
    if (searchResults.length === 0) return [];
    
    const pageTitle = searchResults[0].title;
    
    const detailUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|categories|info&exintro=1&explaintext=1&inprop=url&titles=${encodeURIComponent(pageTitle)}&redirects=1`;
    const detailRes = await axios.get(detailUrl, { headers, timeout: 5000 });
    const pages = detailRes.data?.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    
    if (!pageId || pageId === '-1') return [];
    
    const page = pages[pageId];
    const title = page.title || pageTitle;
    const summary = page.extract || 'No summary available.';
    const url = page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
    const categories = (page.categories || []).map((cat: any) => cat.title.replace('Category:', '')).slice(0, 10);
    
    return [{
      title,
      summary,
      url,
      categories
    }];
  } catch (error: any) {
    console.error(`[Wikipedia Tool] Error:`, error.message);
    return [];
  }
}

/**
 * HackerNews Search: Query Algolia HN Search API.
 */
export async function hackernewsSearch(query: string): Promise<HackerNewsResult[]> {
  try {
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=5`;
    const res = await axios.get(url, { timeout: 5000 });
    const hits = res.data?.hits || [];
    
    return hits.map((hit: any) => {
      const title = hit.title || 'No Title';
      const storyId = hit.objectID;
      const storyUrl = hit.url || `https://news.ycombinator.com/item?id=${storyId}`;
      const points = hit.points || 0;
      const comments = hit.num_comments || 0;
      const date = hit.created_at ? hit.created_at.substring(0, 10) : 'Unknown Date';
      return { title, url: storyUrl, points, comments, date };
    });
  } catch (error: any) {
    console.error(`[HackerNews Tool] Error:`, error.message);
    return [];
  }
}

/**
 * Reddit Search: Query Reddit's public search JSON endpoint.
 */
export async function redditSearch(query: string): Promise<RedditResult[]> {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=5&type=link&t=year`;
    const userAgent = config.redditUserAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ResearchFlow/1.0';
    
    const res = await axios.get(url, {
      headers: { 
        'User-Agent': userAgent,
        'Accept': 'application/json'
      },
      timeout: 5000
    });
    
    const children = res.data?.data?.children || [];
    return children.map((child: any) => {
      const post = child.data || {};
      const title = post.title || 'No Title';
      const subreddit = `r/${post.subreddit || 'unknown'}`;
      const score = post.score || 0;
      const permalink = post.permalink || '';
      let content = post.selftext || '';
      
      if (content.length > 500) {
        content = content.substring(0, 500) + '...';
      }
      
      return {
        title,
        content: content || '[Link post]',
        url: permalink ? `https://www.reddit.com${permalink}` : '',
        subreddit,
        score
      };
    });
  } catch (error: any) {
    console.warn(`[Reddit Tool] Request failed: ${error.message}. Falling back to Tavily Reddit search...`);
    try {
      const tavilyRes = await searchWeb([`site:reddit.com ${query}`]);
      const resultsArray = tavilyRes[0] || [];
      return resultsArray.map(r => {
        const subMatch = r.url.match(/reddit\.com\/r\/([^/]+)/);
        const subreddit = subMatch ? `r/${subMatch[1]}` : 'r/reddit';
        return {
          title: r.title,
          content: r.snippet,
          url: r.url,
          subreddit,
          score: 10
        };
      });
    } catch (e: any) {
      console.error(`[Reddit Fallback Tool] Tavily fallback failed:`, e.message);
    }
    return [];
  }
}

/**
 * GitHub Search: Query GitHub Repositories Search API.
 */
export async function githubSearch(query: string): Promise<GitHubResult[]> {
  try {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=5`;
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'ResearchMind/1.0'
    };
    
    const res = await axios.get(url, { headers, timeout: 5000 });
    const items = res.data?.items || [];
    
    return items.map((item: any) => ({
      name: item.full_name || 'Unknown Repository',
      description: item.description || 'No description provided.',
      url: item.html_url || '',
      stars: item.stargazers_count || 0,
      language: item.language || 'Unspecified'
    }));
  } catch (error: any) {
    console.error(`[GitHub Tool] Error:`, error.message);
    return [];
  }
}

/**
 * DuckDuckGo Search: Scrape html.duckduckgo.com.
 */
export async function duckduckgoSearch(query: string): Promise<DuckDuckGoResult[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };
    
    const res = await axios.get(url, { headers, timeout: 5000 });
    const html = res.data as string;
    
    const results: DuckDuckGoResult[] = [];
    const blockRegex = /<div class="result results_links results_links_deep web-result[\s\S]*?">([\s\S]*?)<\/div>/g;
    let blockMatch;
    
    while ((blockMatch = blockRegex.exec(html)) !== null && results.length < 5) {
      const block = blockMatch[1];
      
      const hrefMatch = block.match(/href="([\s\S]*?)"/);
      const titleMatch = block.match(/class="result__snippet"[\s\S]*?>([\s\S]*?)<\/a>/) || block.match(/class="result__url"[\s\S]*?>([\s\S]*?)<\/a>/);
      const snippetMatch = block.match(/<a class="result__snippet"[\s\S]*?>([\s\S]*?)<\/a>/) || block.match(/<td class="result-snippet">([\s\S]*?)<\/td>/);
      
      const rawUrl = hrefMatch ? hrefMatch[1] : '';
      let finalUrl = rawUrl;
      if (rawUrl.includes('uddg=')) {
        const parts = rawUrl.split('uddg=');
        if (parts[1]) {
          finalUrl = decodeURIComponent(parts[1].split('&')[0]);
        }
      }
      
      const cleanHtml = (str: string) => str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      
      const title = titleMatch ? cleanHtml(titleMatch[1]) : 'No Title';
      const body = snippetMatch ? cleanHtml(snippetMatch[1]) : 'No snippet available.';
      
      if (finalUrl) {
        results.push({ title, url: finalUrl, body });
      }
    }
    
    if (results.length === 0) {
      const fallbackUrlRegex = /<a class="result__url" href="([\s\S]*?)"/g;
      let fMatch;
      while ((fMatch = fallbackUrlRegex.exec(html)) !== null && results.length < 5) {
        let u = fMatch[1];
        if (u.includes('uddg=')) {
          const parts = u.split('uddg=');
          if (parts[1]) u = decodeURIComponent(parts[1].split('&')[0]);
        }
        results.push({
          title: 'Web Result',
          url: u,
          body: 'Information retrieved from DuckDuckGo search.'
        });
      }
    }

    if (results.length === 0) {
      console.warn(`[DuckDuckGo Tool] Blocked or empty search results. Falling back to Tavily...`);
      const tavilyRes = await searchWeb([query]);
      const resultsArray = tavilyRes[0] || [];
      return resultsArray.map(r => ({
        title: r.title,
        url: r.url,
        body: r.snippet
      }));
    }
    
    return results;
  } catch (error: any) {
    console.error(`[DuckDuckGo Tool] Error:`, error.message);
    try {
      console.warn(`[DuckDuckGo Tool] Catch branch: Falling back to Tavily...`);
      const tavilyRes = await searchWeb([query]);
      const resultsArray = tavilyRes[0] || [];
      return resultsArray.map(r => ({
        title: r.title,
        url: r.url,
        body: r.snippet
      }));
    } catch (e: any) {
      console.warn(`[DuckDuckGo Fallback Tool] Tavily fallback also failed:`, e.message);
    }
    return [];
  }
}

/**
 * News Search: Query NewsAPI (or fallback to DuckDuckGo).
 */
export async function newsSearch(query: string): Promise<NewsResult[]> {
  const apiKey = config.newsApiKey;
  if (!apiKey || apiKey.includes('your_news_api')) {
    const ddg = await duckduckgoSearch(query);
    return ddg.map(r => ({
      title: r.title,
      description: r.body,
      url: r.url,
      source: 'DuckDuckGo Search (Fallback)',
      date: new Date().toISOString().substring(0, 10)
    }));
  }
  
  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevance&language=en&pageSize=5&apiKey=${apiKey}`;
    const res = await axios.get(url, { timeout: 5000 });
    const articles = res.data?.articles || [];
    
    return articles.map((art: any) => {
      const title = art.title || 'No Title';
      const artUrl = art.url || '';
      const description = art.description || art.content || 'No description available.';
      const source = art.source?.name || 'Unknown Source';
      const published = art.publishedAt || '';
      const date = published.length >= 10 ? published.substring(0, 10) : 'Unknown Date';
      
      return { title, description, url: artUrl, source, date };
    });
  } catch (error: any) {
    console.warn(`[News Tool] NewsAPI failed, falling back to DuckDuckGo:`, error.message);
    const ddg = await duckduckgoSearch(query);
    return ddg.map(r => ({
      title: r.title,
      description: r.body,
      url: r.url,
      source: 'DuckDuckGo Search (Fallback)',
      date: new Date().toISOString().substring(0, 10)
    }));
  }
}

/**
 * YouTube Transcript: Scrapes YouTube page caption tracks and pulls transcripts.
 */
export async function youtubeTranscript(url: string): Promise<YouTubeTranscriptResult[]> {
  const videoIdMatch = url.match(/(?:v=|\/v\/|embed\/|youtu\.be\/|\/embed\/|\/watch\?v=|\/watch\?.+&v=)([^#\&\?]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;
  if (!videoId) return [];
  
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const watchRes = await axios.get(watchUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      timeout: 5000
    });
    const pageHtml = watchRes.data as string;
    
    let title = `YouTube Video ID: ${videoId}`;
    const titleMatch = pageHtml.match(/<title>(.*?)<\/title>/);
    if (titleMatch) {
      title = titleMatch[1].replace('- YouTube', '').trim();
    }
    
    const timedTextMatch = pageHtml.match(/"captionTracks":\s*(\[.*?\])/);
    if (!timedTextMatch) {
      return [{ transcript: '[No transcript tracks found for this video. Captions might be disabled.]', video_title: title, url }];
    }
    
    const captionTracks = JSON.parse(timedTextMatch[1]);
    if (captionTracks.length === 0) {
      return [{ transcript: '[No transcript tracks found for this video.]', video_title: title, url }];
    }
    
    const trackUrl = captionTracks[0].baseUrl;
    if (!trackUrl) return [];
    
    const transcriptRes = await axios.get(trackUrl, { timeout: 5000 });
    const transcriptXml = transcriptRes.data as string;
    
    const textNodeRegex = /<text[\s\S]*?>([\s\S]*?)<\/text>/g;
    const pieces: string[] = [];
    let textMatch;
    
    while ((textMatch = textNodeRegex.exec(transcriptXml)) !== null) {
      const txt = textMatch[1]
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/<[^>]*>/g, '')
        .trim();
      if (txt) pieces.push(txt);
    }
    
    let transcript = pieces.join(' ');
    if (transcript.length > 10000) {
      transcript = transcript.substring(0, 10000) + '\n[Transcript truncated due to length limits]';
    }
    
    return [{
      transcript,
      video_title: title,
      url
    }];
  } catch (error: any) {
    console.error(`[YouTube Tool] Error:`, error.message);
    return [];
  }
}

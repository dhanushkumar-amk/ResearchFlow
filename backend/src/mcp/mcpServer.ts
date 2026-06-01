import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

import { searchWeb } from '../tools/tavilySearch';
import { searchChunks, collectionExists } from '../rag/vectorStore';
import { setMemory, getMemory } from '../db/redis';
import {
  pubmedSearch,
  arxivSearch,
  wikipediaSearch,
  hackernewsSearch,
  redditSearch,
  githubSearch,
  newsSearch,
  duckduckgoSearch,
  youtubeTranscript
} from '../tools/mcpTools';

/**
 * Phase 26-30: Research Tools MCP Server
 * Refactored to call raw tools directly.
 * Formats results inside the tool handler for a standardized agent interface.
 */
class ResearchMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      { name: 'research-tools-server', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    this.setupHandlers();

    this.server.onerror = (error: unknown) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers() {
    // ── tools/list ──────────────────────────────────────────────────────────
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'web_search',
          description: 'Search the live web for real-time information and research data.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'The search query.' },
            },
            required: ['query'],
          },
        },
        {
          name: 'document_search',
          description: 'Search private uploaded documents using semantic similarity (RAG).',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'The search query.' },
              collection_name: {
                type: 'string',
                description: 'Qdrant collection name (defaults to "default").',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'save_memory',
          description: 'Save a key-value pair to session-based short-term memory (Redis with TTL).',
          inputSchema: {
            type: 'object',
            properties: {
              session_id: { type: 'string', description: 'The unique research session ID.' },
              key: { type: 'string', description: 'The memory key.' },
              value: { type: 'string', description: 'The information to store.' },
              ttl_seconds: {
                type: 'number',
                description: 'Time to live in seconds (default: 3600).',
              },
            },
            required: ['session_id', 'key', 'value'],
          },
        },
        {
          name: 'get_memory',
          description: 'Retrieve a value from session-based short-term memory.',
          inputSchema: {
            type: 'object',
            properties: {
              session_id: { type: 'string', description: 'The unique research session ID.' },
              key: { type: 'string', description: 'The memory key.' },
            },
            required: ['session_id', 'key'],
          },
        },
        {
          name: 'pubmed_search',
          description: 'Search PubMed for biomedical literature and clinical study details.',
          inputSchema: {
            type: 'object',
            properties: { query: { type: 'string', description: 'Biomedical or clinical search query.' } },
            required: ['query'],
          },
        },
        {
          name: 'arxiv_search',
          description: 'Search ArXiv for academic publications, physics, computer science, and AI papers.',
          inputSchema: {
            type: 'object',
            properties: { query: { type: 'string', description: 'Academic search query.' } },
            required: ['query'],
          },
        },
        {
          name: 'wikipedia_search',
          description: 'Search Wikipedia for background knowledge, definitions, history, and concepts.',
          inputSchema: {
            type: 'object',
            properties: { query: { type: 'string', description: 'General knowledge query.' } },
            required: ['query'],
          },
        },
        {
          name: 'hackernews_search',
          description: 'Search HackerNews stories and discussions for community opinions and tech news.',
          inputSchema: {
            type: 'object',
            properties: { query: { type: 'string', description: 'Tech community query.' } },
            required: ['query'],
          },
        },
        {
          name: 'reddit_search',
          description: 'Search Reddit user discussions, threads, and reviews.',
          inputSchema: {
            type: 'object',
            properties: { query: { type: 'string', description: 'Social discussion query.' } },
            required: ['query'],
          },
        },
        {
          name: 'github_search',
          description: 'Search GitHub repositories for open source projects, code, and libraries.',
          inputSchema: {
            type: 'object',
            properties: { query: { type: 'string', description: 'Code repository search query.' } },
            required: ['query'],
          },
        },
        {
          name: 'news_search',
          description: 'Search global news articles for breaking announcements and trend reports.',
          inputSchema: {
            type: 'object',
            properties: { query: { type: 'string', description: 'News search query.' } },
            required: ['query'],
          },
        },
        {
          name: 'duckduckgo_search',
          description: 'General web search using DuckDuckGo.',
          inputSchema: {
            type: 'object',
            properties: { query: { type: 'string', description: 'General web query.' } },
            required: ['query'],
          },
        },
        {
          name: 'youtube_transcript',
          description: 'Retrieve transcripts for YouTube videos given their URLs.',
          inputSchema: {
            type: 'object',
            properties: { url: { type: 'string', description: 'The YouTube video URL.' } },
            required: ['url'],
          },
        },
      ],
    }));

    // ── tools/call ──────────────────────────────────────────────────────────
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      // ── web_search ────────────────────────────────────────────────────────
      if (name === 'web_search') {
        const query = (args as any)?.query as string;
        if (!query) throw new McpError(ErrorCode.InvalidParams, 'Query is required.');

        try {
          // CALLING RAW TAVILY SEARCH (Unified logic)
          const resultsArray = await searchWeb([query]);
          const results = resultsArray[0] || [];

          let formatted = `🔎 Web search results for: "${query}":\n\n`;
          results.forEach((res, i) => {
            formatted += `[${i + 1}] ${res.title}\nURL: ${res.url}\nSnippet: ${res.snippet}\n\n`;
          });

          return { content: [{ type: 'text', text: formatted || 'No results found.' }] };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: `❌ Web Search Error: ${error.message}` }],
            isError: true,
        };
        }
    }

      // ── document_search ───────────────────────────────────────────────────
    if (name === 'document_search') {
        const query = (args as any)?.query as string;
        const collectionName = ((args as any)?.collection_name as string) || 'default';

        if (!query) throw new McpError(ErrorCode.InvalidParams, 'Query is required.');

        try {
          const exists = await collectionExists(collectionName);
          if (!exists) {
            return {
              content: [{
                type: 'text',
                text: `📂 No documents uploaded yet. Please upload documents to the "${collectionName}" collection first.`,
              }],
            };
          }

          const chunks = await searchChunks(collectionName, query, 5);

          if (!chunks || chunks.length === 0) {
            return {
              content: [{
                type: 'text',
                text: '🔍 No relevant information found in uploaded documents.',
              }],
            };
          }

          const formatted = chunks.map((chunk, i) => {
            const source = chunk.metadata?.source || 'Unknown document';
            const page = chunk.metadata?.page !== undefined ? ` (Page ${chunk.metadata.page})` : '';
            return `--- From ${source}${page} ---\n${chunk.text}`;
          }).join('\n\n');

          return { content: [{ type: 'text', text: formatted }] };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: `❌ Document Search Error: ${error.message}` }],
            isError: true,
          };
        }
      }

      // ── save_memory ───────────────────────────────────────────────────────
      if (name === 'save_memory') {
        const { session_id, key, value, ttl_seconds } = args as any;
        if (!session_id || !key || !value) {
          throw new McpError(ErrorCode.InvalidParams, 'session_id, key, and value are required.');
        }

        try {
          const redisKey = `${session_id}:${key}`;
          const ttl = ttl_seconds || 3600;
          const success = await setMemory(redisKey, value, ttl);

          return {
            content: [{
              type: 'text',
              text: success ? `✅ Memory saved: ${key}` : '❌ Failed to save memory.',
            }],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: `❌ Memory Save Error: ${error.message}` }],
            isError: true,
          };
        }
      }

      // ── get_memory ────────────────────────────────────────────────────────
      if (name === 'get_memory') {
        const { session_id, key } = args as any;
        if (!session_id || !key) {
          throw new McpError(ErrorCode.InvalidParams, 'session_id and key are required.');
        }

        try {
          const redisKey = `${session_id}:${key}`;
          const value = await getMemory(redisKey);

          if (value === null || value === undefined) {
            return {
              content: [{ type: 'text', text: '🧠 Memory not found for this key.' }],
            };
          }

          return {
            content: [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }],
          };
        } catch (error: any) {
          return {
            content: [{ type: 'text', text: `❌ Memory Retrieval Error: ${error.message}` }],
            isError: true,
          };
        }
      }

      // ── pubmed_search ─────────────────────────────────────────────────────
      if (name === 'pubmed_search') {
        const query = (args as any)?.query as string;
        if (!query) throw new McpError(ErrorCode.InvalidParams, 'Query is required.');
        try {
          const res = await pubmedSearch(query);
          return { content: [{ type: 'text', text: JSON.stringify(res) }] };
        } catch (error: any) {
          return { content: [{ type: 'text', text: `❌ PubMed Error: ${error.message}` }], isError: true };
        }
      }

      // ── arxiv_search ──────────────────────────────────────────────────────
      if (name === 'arxiv_search') {
        const query = (args as any)?.query as string;
        if (!query) throw new McpError(ErrorCode.InvalidParams, 'Query is required.');
        try {
          const res = await arxivSearch(query);
          return { content: [{ type: 'text', text: JSON.stringify(res) }] };
        } catch (error: any) {
          return { content: [{ type: 'text', text: `❌ ArXiv Error: ${error.message}` }], isError: true };
        }
      }

      // ── wikipedia_search ──────────────────────────────────────────────────
      if (name === 'wikipedia_search') {
        const query = (args as any)?.query as string;
        if (!query) throw new McpError(ErrorCode.InvalidParams, 'Query is required.');
        try {
          const res = await wikipediaSearch(query);
          return { content: [{ type: 'text', text: JSON.stringify(res) }] };
        } catch (error: any) {
          return { content: [{ type: 'text', text: `❌ Wikipedia Error: ${error.message}` }], isError: true };
        }
      }

      // ── hackernews_search ─────────────────────────────────────────────────
      if (name === 'hackernews_search') {
        const query = (args as any)?.query as string;
        if (!query) throw new McpError(ErrorCode.InvalidParams, 'Query is required.');
        try {
          const res = await hackernewsSearch(query);
          return { content: [{ type: 'text', text: JSON.stringify(res) }] };
        } catch (error: any) {
          return { content: [{ type: 'text', text: `❌ HackerNews Error: ${error.message}` }], isError: true };
        }
      }

      // ── reddit_search ─────────────────────────────────────────────────────
      if (name === 'reddit_search') {
        const query = (args as any)?.query as string;
        if (!query) throw new McpError(ErrorCode.InvalidParams, 'Query is required.');
        try {
          const res = await redditSearch(query);
          return { content: [{ type: 'text', text: JSON.stringify(res) }] };
        } catch (error: any) {
          return { content: [{ type: 'text', text: `❌ Reddit Error: ${error.message}` }], isError: true };
        }
      }

      // ── github_search ─────────────────────────────────────────────────────
      if (name === 'github_search') {
        const query = (args as any)?.query as string;
        if (!query) throw new McpError(ErrorCode.InvalidParams, 'Query is required.');
        try {
          const res = await githubSearch(query);
          return { content: [{ type: 'text', text: JSON.stringify(res) }] };
        } catch (error: any) {
          return { content: [{ type: 'text', text: `❌ GitHub Error: ${error.message}` }], isError: true };
        }
      }

      // ── news_search ───────────────────────────────────────────────────────
      if (name === 'news_search') {
        const query = (args as any)?.query as string;
        if (!query) throw new McpError(ErrorCode.InvalidParams, 'Query is required.');
        try {
          const res = await newsSearch(query);
          return { content: [{ type: 'text', text: JSON.stringify(res) }] };
        } catch (error: any) {
          return { content: [{ type: 'text', text: `❌ News Error: ${error.message}` }], isError: true };
        }
      }

      // ── duckduckgo_search ─────────────────────────────────────────────────
      if (name === 'duckduckgo_search') {
        const query = (args as any)?.query as string;
        if (!query) throw new McpError(ErrorCode.InvalidParams, 'Query is required.');
        try {
          const res = await duckduckgoSearch(query);
          return { content: [{ type: 'text', text: JSON.stringify(res) }] };
        } catch (error: any) {
          return { content: [{ type: 'text', text: `❌ DuckDuckGo Error: ${error.message}` }], isError: true };
        }
      }

      // ── youtube_transcript ────────────────────────────────────────────────
      if (name === 'youtube_transcript') {
        const url = (args as any)?.url as string;
        if (!url) throw new McpError(ErrorCode.InvalidParams, 'URL is required.');
        try {
          const res = await youtubeTranscript(url);
          return { content: [{ type: 'text', text: JSON.stringify(res) }] };
        } catch (error: any) {
          return { content: [{ type: 'text', text: `❌ YouTube Transcript Error: ${error.message}` }], isError: true };
        }
      }

      throw new McpError(ErrorCode.MethodNotFound, `Tool not found: ${name}`);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('🚀 Research MCP Server running on Stdio transport...');
  }
}

const server = new ResearchMcpServer();
server.run().catch(console.error);

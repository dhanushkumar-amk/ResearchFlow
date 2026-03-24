import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { runSearchAgent } from '../agents/search';
import { searchChunks, collectionExists } from '../rag/vectorStore';
import { setMemory, getMemory } from '../db/redis';

/**
 * Phase 26-29: Research Tools MCP Server
 * Exposes research tools (Web, Documents, Memory) to any MCP-compatible AI client.
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
          const results = await runSearchAgent(query);
          return { content: [{ type: 'text', text: results }] };
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
            return `[${i + 1}] Source: ${source}${page}\n${chunk.text}`;
          }).join('\n\n---\n\n');

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
              text: success ? `✅ Memory saved: ${key} (TTL: ${ttl}s)` : '❌ Failed to save memory.',
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

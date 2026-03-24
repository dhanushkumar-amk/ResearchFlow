import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { runSearchAgent } from '../agents/search';

/**
 * Phase 26-27: Research Tools MCP Server
 * Purpose: Expose our custom analysis tools to any MCP-compatible AI client.
 */
class ResearchMcpServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'research-tools-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    
    // Error handling
    this.server.onerror = (error: unknown) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers() {
    /**
     * Handler for listing available tools.
     */
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'web_search',
          description: 'Search the live web for real-time information and research data.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query or research question.',
              },
            },
            required: ['query'],
          },
        },
      ],
    }));

    /**
     * Handler for calling specific tools.
     */
    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      if (name === 'web_search') {
        const query = (args as any)?.query;
        if (!query) {
          throw new McpError(ErrorCode.InvalidParams, 'Query parameter is required.');
        }

        try {
          const results = await runSearchAgent(query);
          return {
            content: [
              {
                type: 'text',
                text: results,
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ Web Search Tool Error: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }

      throw new McpError(
        ErrorCode.MethodNotFound,
        `Tool not found: ${name}`
      );
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

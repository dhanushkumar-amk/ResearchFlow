import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Phase 26: Research Tools MCP Server
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
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers() {
    /**
     * Handler for listing available tools.
     * Starts empty for this phase.
     */
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [],
    }));

    /**
     * Handler for calling specific tools.
     */
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      throw new McpError(
        ErrorCode.MethodNotFound,
        `Tool not found: ${request.params.name}`
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

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';

/**
 * Phase 30: MCP Tool Client
 * Provides a standardized way for Agents to invoke tools via the MCP Server.
 * This ensures all tool logic is centralized and follows the MCP protocol.
 */
export async function callMcpTool(name: string, args: any): Promise<string> {
  const serverPath = path.resolve(__dirname, 'mcpServer.ts');
  
  // We use Stdio transport to communicate with our own MCP server.
  // This simulates an external client calling the tools.
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['ts-node', serverPath],
    env: { ...process.env, NODE_ENV: 'development' }
  });

  const client = new Client(
    { name: 'research-agent-internal-client', version: '1.0.0' },
    { capabilities: {} }
  );

  try {
    await client.connect(transport);
    
    const response = (await client.callTool({
      name,
      arguments: args,
    })) as { content: Array<{ type: string; text: string }>, isError?: boolean };

    // Check for error content
    if (response.isError) {
      throw new Error(response.content[0]?.text || 'Unknown MCP error');
    }

    return response.content[0]?.text || '';
  } catch (error: any) {
    console.error(`❌ [MCP Client] Error calling tool "${name}":`, error.message);
    throw error;
  } finally {
    // Crucial: Close the transport to prevent zombie processes
    await transport.close();
  }
}

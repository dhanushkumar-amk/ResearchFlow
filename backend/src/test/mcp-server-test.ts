import { spawn } from 'child_process';
import path from 'path';

async function testMcpServer() {
  console.log('📡 Testing Research MCP Server (Phase 26)...\n');

  // Spawn the child process for the MCP server
  const serverPath = path.resolve(__dirname, '../mcp/mcpServer.ts');
  const server = spawn('npx', ['ts-node', serverPath], { shell: true });

  // JSON-RPC request for list_tools
  const listToolsRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  };

  let capturedOutput = '';

  return new Promise((resolve, reject) => {
    server.stdout.on('data', (data) => {
      const output = data.toString();
      capturedOutput += output;
      
      try {
        const response = JSON.parse(output);
        if (response.id === 1 && response.result) {
          console.log('✅ [SUCCESS] Received response from MCP Server!');
          console.log('📦 Tools Count:', response.result.tools.length);
          server.kill();
          resolve(true);
        }
      } catch (err) {
        // Not JSON yet (might be stderr logs or partial output)
      }
    });

    server.stderr.on('data', (data) => {
      console.log('📝 Server Log:', data.toString().trim());
    });

    server.on('error', (err) => {
      console.error('❌ Server failed to start:', err.message);
      reject(err);
    });

    // Send the request via stdin
    server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

    // Timeout after 15 seconds
    setTimeout(() => {
      server.kill();
      if (!capturedOutput) {
        reject(new Error('Timeout: MCP Server did not respond to list_tools.'));
      }
    }, 15000);
  });
}

testMcpServer();

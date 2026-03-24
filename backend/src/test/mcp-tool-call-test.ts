import { spawn } from 'child_process';
import path from 'path';

async function testToolCall() {
  console.log('📡 Testing MCP Tool: web_search...\n');

  const serverPath = path.resolve(__dirname, '../mcp/mcpServer.ts');
  const server = spawn('npx', ['ts-node', serverPath], { shell: true });

  const query = 'What is the Model Context Protocol in AI?';
  const toolCallRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: {
      name: "web_search",
      arguments: { query }
    }
  };

  return new Promise((resolve, reject) => {
    server.stdout.on('data', (data) => {
      const output = data.toString();
      try {
        const response = JSON.parse(output);
        if (response.id === 1 && response.result) {
          console.log('✅ [SUCCESS] Received tool results!');
          console.log('\n--- Tool Output ---');
          console.log(response.result.content[0].text.substring(0, 500) + '...');
          console.log('-------------------\n');
          server.kill();
          resolve(true);
        } else if (response.error) {
           console.error('❌ [ERROR] tool call returned error:', response.error);
           server.kill();
           reject(new Error(response.error.message));
        }
      } catch (err) {
        // Not JSON
      }
    });

    server.stderr.on('data', (data) => {
      console.log('📝 Server Log:', data.toString().trim());
    });

    // Send the request via stdin
    server.stdin.write(JSON.stringify(toolCallRequest) + '\n');

    // Timeout after 30 seconds (it calls Tavily)
    setTimeout(() => {
      server.kill();
      reject(new Error('Timeout: MCP Tool Call did not respond.'));
    }, 30000);
  });
}

testToolCall();

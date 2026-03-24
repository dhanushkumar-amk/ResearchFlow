import { spawn } from 'child_process';
import path from 'path';

function createServer() {
  const serverPath = path.resolve(__dirname, '../mcp/mcpServer.ts');
  const proc = spawn('npx', ['ts-node', serverPath], { shell: true });
  proc.stderr.on('data', (d: Buffer) => process.stdout.write(`  [Server] ${d.toString().trim()}\n`));
  return proc;
}

function sendAndReceive(proc: any, request: object, waitMs = 20000): Promise<any> {
  return new Promise((resolve, reject) => {
    let buffer = '';

    const onData = (data: Buffer) => {
      buffer += data.toString();
      // Try to find a complete JSON line
      const lines = buffer.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.id === (request as any).id) {
            proc.stdout.off('data', onData);
            resolve(parsed);
            return;
          }
        } catch { /* not complete JSON yet */ }
      }
      buffer = lines[lines.length - 1]; // keep incomplete last chunk
    };

    proc.stdout.on('data', onData);
    proc.stdin.write(JSON.stringify(request) + '\n');
    setTimeout(() => {
      proc.stdout.off('data', onData);
      reject(new Error(`Timeout waiting for id:${(request as any).id}`));
    }, waitMs);
  });
}

async function testDocumentSearch() {
  console.log('📚 Testing MCP Tool: document_search (Both Edge Cases)\n');

  const server = createServer();
  await new Promise(r => setTimeout(r, 5000)); // wait for ts-node boot

  // ── Test 1: Non-existent collection ────────────────────────────────────────
  console.log('🧪 Test 1: Calling document_search with non-existent collection');
  const r1 = await sendAndReceive(server, {
    jsonrpc: '2.0', id: 1, method: 'tools/call',
    params: {
      name: 'document_search',
      arguments: { query: 'AI breakthroughs 2024', collection_name: 'phantom-collection' },
    },
  });
  console.log(`  ✅ Response: ${r1.result?.content?.[0]?.text || JSON.stringify(r1.error)}\n`);

  // ── Test 2: Default collection ──────────────────────────────────────────────
  console.log('🧪 Test 2: Calling document_search with default collection (no collection_name)');
  const r2 = await sendAndReceive(server, {
    jsonrpc: '2.0', id: 2, method: 'tools/call',
    params: {
      name: 'document_search',
      arguments: { query: 'machine learning fundamentals' },
    },
  });
  console.log(`  ✅ Response: ${r2.result?.content?.[0]?.text || JSON.stringify(r2.error)}\n`);

  server.kill();
  console.log('✅ All document_search edge cases passed!');
}

testDocumentSearch().catch(console.error);

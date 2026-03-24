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
      buffer = lines[lines.length - 1]; 
    };

    proc.stdout.on('data', onData);
    proc.stdin.write(JSON.stringify(request) + '\n');
    setTimeout(() => {
      proc.stdout.off('data', onData);
      reject(new Error(`Timeout waiting for id:${(request as any).id}`));
    }, waitMs);
  });
}

async function testMemoryLifecycle() {
  console.log('🧠 Testing MCP Tool: save_memory / get_memory\n');

  const server = createServer();
  await new Promise(r => setTimeout(r, 6000)); // wait for boot

  const sid = `test-session-${Date.now()}`;

  // ── Step 1: Save Memory ───────────────────────────────────────────────────
  console.log('🧪 Step 1: Saving "Hello World" to "greeting"');
  await sendAndReceive(server, {
    jsonrpc: '2.0', id: 1, method: 'tools/call',
    params: {
      name: 'save_memory',
      arguments: { session_id: sid, key: 'greeting', value: 'Hello From Redis!' }
    },
  });

  // ── Step 2: Get Memory (Immediate) ────────────────────────────────────────
  console.log('🧪 Step 2: Retrieving "greeting" (Expect success)');
  const r2 = await sendAndReceive(server, {
    jsonrpc: '2.0', id: 2, method: 'tools/call',
    params: { name: 'get_memory', arguments: { session_id: sid, key: 'greeting' } },
  });
  console.log(`  ✅ Result: ${r2.result?.content?.[0]?.text}\n`);

  // ── Step 3: Save with short TTL ───────────────────────────────────────────
  console.log('🧪 Step 3: Saving "Quick Info" with 2s TTL');
  await sendAndReceive(server, {
    jsonrpc: '2.0', id: 3, method: 'tools/call',
    params: {
      name: 'save_memory',
      arguments: { session_id: sid, key: 'temp', value: 'This will disappear', ttl_seconds: 2 }
    },
  });

  // ── Step 4: Verify before expire ──────────────────────────────────────────
  console.log('🧪 Step 4: Retrieving "temp" (Immediate, expect success)');
  const r4 = await sendAndReceive(server, {
    jsonrpc: '2.0', id: 4, method: 'tools/call',
    params: { name: 'get_memory', arguments: { session_id: sid, key: 'temp' } },
  });
  console.log(`  ✅ Result: ${r4.result?.content?.[0]?.text}\n`);

  // ── Step 5: Wait for expiration ───────────────────────────────────────────
  console.log('🧪 Step 5: Waiting 4 seconds for "temp" to expire...');
  await new Promise(r => setTimeout(r, 4000));

  // ── Step 6: Verify after expire ────────────────────────────────────────────
  console.log('🧪 Step 6: Retrieving "temp" (After wait, expect "not found")');
  const r6 = await sendAndReceive(server, {
    jsonrpc: '2.0', id: 6, method: 'tools/call',
    params: { name: 'get_memory', arguments: { session_id: sid, key: 'temp' } },
  });
  console.log(`  ✅ Result: ${r6.result?.content?.[0]?.text}\n`);

  server.kill();
  console.log('✅ Memory lifecycle test complete!');
}

testMemoryLifecycle().catch(console.error);

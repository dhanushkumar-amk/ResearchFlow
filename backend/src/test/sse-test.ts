import axios from 'axios';
import http from 'http';

async function testSSE() {
  console.log('📡 Testing SSE Foundation (Phase 31)\n');

  const sessionId = `test-sse-${Date.now()}`;
  const baseUrl = 'http://localhost:3001/api/research';

  try {
    // 1. Start the research
    console.log(`🚀 Sending POST to start research (Session: ${sessionId})`);
    const startRes = await axios.post(`${baseUrl}/start`, {
      query: 'Testing SSE infrastructure',
      sessionId: sessionId
    });
    console.log('✅ Response:', startRes.data);

    // 2. Open the stream
    console.log(`\n🔌 Opening SSE stream: ${baseUrl}/${sessionId}/stream`);
    
    const req = http.get(`${baseUrl}/${sessionId}/stream`, (res) => {
      console.log('✅ Stream connected! Waiting for events...\n');
      
      res.on('data', (chunk) => {
        const text = chunk.toString();
        process.stdout.write(`📥 EVENT RECEIVED:\n${text}\n`);
      });

      // Close after 10 seconds of listening
      setTimeout(() => {
        console.log('\n🛑 Closing test after 10 seconds.');
        req.destroy();
        process.exit(0);
      }, 10000);
    });

    req.on('error', (err) => {
      console.error('❌ Stream error:', err.message);
      process.exit(1);
    });

  } catch (err: any) {
    console.error('❌ Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

testSSE();

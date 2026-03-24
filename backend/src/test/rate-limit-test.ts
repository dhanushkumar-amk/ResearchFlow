import axios from 'axios';

async function testRateLimit() {
  const url = 'http://localhost:3001/api/research/start';
  const payload = {
    query: 'Rate limit test',
    sessionId: 'test_limit_session'
  };

  console.log('🚀 Sending 11 rapid requests to check rate limiting...');

  for (let i = 1; i <= 11; i++) {
    try {
      const res = await axios.post(url, payload);
      console.log(`✅ Request ${i}: Status ${res.status}`);
    } catch (err: any) {
      if (err.response) {
        console.log(`❌ Request ${i}: Status ${err.response.status} - ${JSON.stringify(err.response.data)}`);
      } else {
        console.error(`❌ Request ${i}: ${err.message}`);
      }
    }
  }
}

testRateLimit();

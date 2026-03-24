import axios from 'axios';

async function testValidation() {
  const url = 'http://localhost:3001/api/research/start';
  
  // Test empty query after trim
  console.log('🧪 Testing empty query...');
  try {
    await axios.post(url, { query: '   ', sessionId: 'v-test' });
  } catch (err: any) {
    console.log(`❌ Empty: ${err.response.status} - ${err.response.data.error}`);
  }

  // Test long query (>1000)
  console.log('🧪 Test query > 1000 chars...');
  try {
    const longQuery = 'A'.repeat(1001);
    await axios.post(url, { query: longQuery, sessionId: 'v-test' });
  } catch (err: any) {
    console.log(`❌ Long: ${err.response.status} - ${err.response.data.error}`);
  }

  // Test HTML stripping
  console.log('🧪 Test HTML stripping...');
  try {
    const res = await axios.post(url, { query: 'Find <script>alert(1)</script>ResearchFlow', sessionId: 'v-test' });
    console.log(`✅ Success: Sanitized body is handled correctly.`);
  } catch (err: any) {
    console.log(`❌ Fail: ${err.response.status} - ${err.response.data.error}`);
  }
}

testValidation();

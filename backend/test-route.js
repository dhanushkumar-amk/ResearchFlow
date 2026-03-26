
const sessionId = 'test-session'; // replace with real ID if test fails
const url = `http://127.0.0.1:3001/api/research/${sessionId}/public`;

async function testFetch() {
  try {
    const res = await fetch(url);
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Response (first 100 chars):', text.substring(0, 100));
    try {
      const json = JSON.parse(text);
      console.log('Valid JSON received');
    } catch (e) {
      console.log('Invalid JSON received');
    }
  } catch (err) {
    console.log('Fetch failed:', err.message);
  }
}

testFetch();

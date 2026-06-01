import axios from 'axios';

async function testDDG() {
  const url = `https://html.duckduckgo.com/html/?q=test`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  };
  try {
    const res = await axios.get(url, { headers });
    console.log("HTML length:", res.data.length);
    console.log("Snippet match:", res.data.includes('result__snippet'));
    console.log("Sample HTML excerpt:\n", res.data.substring(res.data.indexOf('<div class="result'), res.data.indexOf('<div class="result') + 1000));
  } catch (err: any) {
    console.error("DDG fetch failed:", err.message);
  }
}
testDDG();





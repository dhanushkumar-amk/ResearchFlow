import { searchWeb, SearchResult } from '../tools/tavilySearch';

// Sample queries from the Planner Agent (Phase 15 test)
const testQueries = [
  "causes of the fall of the Roman Empire history",
  "how do mRNA vaccines work mechanism explained",
  "quantum computing impact on cryptography security",
];

async function testTavilySearch() {
  console.log('🚀 Starting Tavily Search Tool Test (Phase 16)...\n');

  try {
    const startTime = Date.now();

    // Run all queries in parallel
    const allResults = await searchWeb(testQueries);
    
    const duration = Date.now() - startTime;
    console.log(`⏱️ All ${testQueries.length} queries completed in ${duration}ms (parallel)\n`);

    // Print results
    testQueries.forEach((query, qi) => {
      console.log(`--------------------------------------------------`);
      console.log(`🔎 QUERY #${qi + 1}: "${query}"`);
      const results = allResults[qi];
      console.log(`📦 Results: ${results.length} found`);

      if (results.length === 0) {
        console.log('  ❌ No results returned.');
        return;
      }

      // Print first 2 results for brevity
      results.slice(0, 2).forEach((r: SearchResult, ri) => {
        console.log(`\n  ✅ Result ${ri + 1}:`);
        console.log(`     Title: ${r.title}`);
        console.log(`     URL:   ${r.url}`);
        console.log(`     Snippet: ${r.snippet.substring(0, 120)}...`);
        if (r.published_date) {
          console.log(`     Published: ${r.published_date}`);
        }
      });
    });

    console.log(`\n✨ Tavily Search Phase 16 test COMPLETE!`);
  } catch (error) {
    console.error('❌ Search test failed:', error);
    process.exit(1);
  }
}

testTavilySearch();

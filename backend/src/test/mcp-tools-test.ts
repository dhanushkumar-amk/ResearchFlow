import { 
  pubmedSearch, 
  arxivSearch, 
  wikipediaSearch, 
  hackernewsSearch, 
  redditSearch, 
  githubSearch, 
  newsSearch, 
  duckduckgoSearch, 
  youtubeTranscript 
} from '../tools/mcpTools';

async function testAllMcpTools() {
  console.log('🚀 Starting Swarm Search Tools Integration Diagnostics...\n');

  // Test 1: Wikipedia
  try {
    console.log('📚 [1/9] Testing Wikipedia Search for "Transformers (deep learning architecture)"...');
    const start = Date.now();
    const results = await wikipediaSearch('Transformers (deep learning architecture)');
    console.log(`   ⏱️ Completed in ${Date.now() - start}ms. Found: ${results.length} pages.`);
    if (results.length > 0) {
      console.log(`   ✅ Title: ${results[0].title}`);
      console.log(`   ✅ URL:   ${results[0].url}`);
      console.log(`   ✅ Snippet: ${results[0].summary.substring(0, 150)}...\n`);
    } else {
      console.log('   ❌ No results found.\n');
    }
  } catch (err: any) {
    console.error('   ❌ Wikipedia Tool error:', err.message, '\n');
  }

  // Test 2: ArXiv
  try {
    console.log('🎓 [2/9] Testing ArXiv Academic Search for "attention is all you need"...');
    const start = Date.now();
    const results = await arxivSearch('attention is all you need');
    console.log(`   ⏱️ Completed in ${Date.now() - start}ms. Found: ${results.length} papers.`);
    if (results.length > 0) {
      console.log(`   ✅ Title: ${results[0].title}`);
      console.log(`   ✅ Authors: ${results[0].authors.join(', ')}`);
      console.log(`   ✅ URL:   ${results[0].url}`);
      console.log(`   ✅ Abstract: ${results[0].abstract.substring(0, 150)}...\n`);
    } else {
      console.log('   ❌ No results found.\n');
    }
  } catch (err: any) {
    console.error('   ❌ ArXiv Tool error:', err.message, '\n');
  }

  // Test 3: PubMed
  try {
    console.log('🔬 [3/9] Testing PubMed Medical Search for "GLP-1 receptor agonist obesity"...');
    const start = Date.now();
    const results = await pubmedSearch('GLP-1 receptor agonist obesity');
    console.log(`   ⏱️ Completed in ${Date.now() - start}ms. Found: ${results.length} studies.`);
    if (results.length > 0) {
      console.log(`   ✅ Title: ${results[0].title}`);
      console.log(`   ✅ URL:   ${results[0].url}`);
      console.log(`   ✅ Abstract: ${results[0].abstract.substring(0, 150)}...\n`);
    } else {
      console.log('   ❌ No results found.\n');
    }
  } catch (err: any) {
    console.error('   ❌ PubMed Tool error:', err.message, '\n');
  }

  // Test 4: HackerNews
  try {
    console.log('💬 [4/9] Testing HackerNews Algolia Search for "Model Quantization"...');
    const start = Date.now();
    const results = await hackernewsSearch('Model Quantization');
    console.log(`   ⏱️ Completed in ${Date.now() - start}ms. Found: ${results.length} threads.`);
    if (results.length > 0) {
      console.log(`   ✅ Title: ${results[0].title}`);
      console.log(`   ✅ Points: ${results[0].points} | Comments: ${results[0].comments}`);
      console.log(`   ✅ URL:   ${results[0].url}\n`);
    } else {
      console.log('   ❌ No results found.\n');
    }
  } catch (err: any) {
    console.error('   ❌ HackerNews Tool error:', err.message, '\n');
  }

  // Test 5: Reddit
  try {
    console.log('🤖 [5/9] Testing Reddit Search for "llama.cpp performance"...');
    const start = Date.now();
    const results = await redditSearch('llama.cpp performance');
    console.log(`   ⏱️ Completed in ${Date.now() - start}ms. Found: ${results.length} threads.`);
    if (results.length > 0) {
      console.log(`   ✅ Title: ${results[0].title}`);
      console.log(`   ✅ Subreddit: ${results[0].subreddit} | Score: ${results[0].score}`);
      console.log(`   ✅ Content: ${results[0].content.substring(0, 150)}...\n`);
    } else {
      console.log('   ❌ No results found.\n');
    }
  } catch (err: any) {
    console.error('   ❌ Reddit Tool error:', err.message, '\n');
  }

  // Test 6: GitHub
  try {
    console.log('📁 [6/9] Testing GitHub Search for "liteLLM"...');
    const start = Date.now();
    const results = await githubSearch('liteLLM');
    console.log(`   ⏱️ Completed in ${Date.now() - start}ms. Found: ${results.length} repos.`);
    if (results.length > 0) {
      console.log(`   ✅ Repo: ${results[0].name}`);
      console.log(`   ✅ Stars: ${results[0].stars} ⭐ | Lang: ${results[0].language}`);
      console.log(`   ✅ URL:   ${results[0].url}\n`);
    } else {
      console.log('   ❌ No results found.\n');
    }
  } catch (err: any) {
    console.error('   ❌ GitHub Tool error:', err.message, '\n');
  }

  // Test 7: DuckDuckGo
  try {
    console.log('🦆 [7/9] Testing DuckDuckGo Scrape Search for "Solid-state batteries OEM"...');
    const start = Date.now();
    const results = await duckduckgoSearch('Solid-state batteries OEM');
    console.log(`   ⏱️ Completed in ${Date.now() - start}ms. Found: ${results.length} results.`);
    if (results.length > 0) {
      console.log(`   ✅ Title: ${results[0].title}`);
      console.log(`   sm:  Link:  ${results[0].url}`);
      console.log(`   ✅ Snippet: ${results[0].body.substring(0, 150)}...\n`);
    } else {
      console.log('   ❌ No results found.\n');
    }
  } catch (err: any) {
    console.error('   ❌ DuckDuckGo Tool error:', err.message, '\n');
  }

  // Test 8: News Search
  try {
    console.log('📰 [8/9] Testing News Search for "Google DeepMind AI"...');
    const start = Date.now();
    const results = await newsSearch('Google DeepMind AI');
    console.log(`   ⏱️ Completed in ${Date.now() - start}ms. Found: ${results.length} articles.`);
    if (results.length > 0) {
      console.log(`   ✅ Title: ${results[0].title}`);
      console.log(`   ✅ Source: ${results[0].source} | Date: ${results[0].date}`);
      console.log(`   ✅ URL:   ${results[0].url}\n`);
    } else {
      console.log('   ❌ No results found.\n');
    }
  } catch (err: any) {
    console.error('   ❌ News Search Tool error:', err.message, '\n');
  }

  // Test 9: YouTube Transcript
  try {
    const testVideoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    console.log(`🎥 [9/9] Testing YouTube Transcript scraping for Rickroll URL "${testVideoUrl}"...`);
    const start = Date.now();
    const results = await youtubeTranscript(testVideoUrl);
    console.log(`   ⏱️ Completed in ${Date.now() - start}ms.`);
    if (results.length > 0) {
      console.log(`   ✅ Title: ${results[0].video_title}`);
      console.log(`   ✅ Transcript excerpt: ${results[0].transcript.substring(0, 200)}...\n`);
    } else {
      console.log('   ❌ No results found.\n');
    }
  } catch (err: any) {
    console.error('   ❌ YouTube Transcript Tool error:', err.message, '\n');
  }

  console.log('✨ All MCP Search Tool diagnostics executed!');
}

testAllMcpTools();

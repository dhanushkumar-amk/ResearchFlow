import { runRagAgent } from '../agents/rag';

async function testRagAgent() {
  console.log('🤖 Test RAG Agent (Agent 3) — End-to-End Retrieval\n');

  // ---- TEST 1: Collection Not Found ----
  console.log('\n--- Test 1: Querying a non-existent collection (graceful empty) ---');
  const emptyRes = await runRagAgent('Any query', 'invalid_colle');
  console.log(`📡 Result Status: ${emptyRes.status}`);
  console.log(`📦 Chunks retrieved: ${emptyRes.chunkCount}`);
  console.log(`📝 Context String length: ${emptyRes.context.length}`);

  // ---- TEST 2: Valid Collection (Transformer Paper) ----
  console.log('\n--- Test 2: Querying the research_test_transformer collection (relevant chunks) ---');
  const validRes = await runRagAgent(
    'the number of attention heads in the transformer',
    'research_test_transformer'
  );
  console.log(`📡 Result Status: ${validRes.status}`);
  console.log(`📦 Chunks retrieved: ${validRes.chunkCount}`);
  console.log(`📝 Context Snippet: \n${validRes.context.substring(0, 300)}...`);

  if (validRes.context.includes('h = 8') || validRes.context.includes('8 parallel')) {
    console.log('\n✨ [PASS]: Successfully retrieved context with source metadata!');
  } else {
    console.log('\n⚠️  [WARN]: Context found but target content "h = 8" not visible in snippet.');
  }

  console.log('\n🏁 RAG Agent Phase 19 test COMPLETE!');
}

testRagAgent();

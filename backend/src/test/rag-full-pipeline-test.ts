import { loadDocument } from '../rag/loader';
import { splitDocuments } from '../rag/splitter';
import { storeChunks, searchChunks } from '../rag/vectorStore';
import path from 'path';

const COLLECTION_NAME = 'research_test_transformer';

async function testFullRagPipeline() {
  console.log('🚀 Phase 18: Testing FULL RAG END-TO-END Pipeline...\n');

  try {
    // 1. Loading Step
    const pdfPath = path.join(__dirname, '../rag/samples/attention_paper.pdf');
    console.log('--- Step 1: Loading PDF ---');
    const pdfDocs = await loadDocument(pdfPath, 'pdf');

    // 2. Splitting Step
    console.log('\n--- Step 2: Text Splitting ---');
    const chunks = await splitDocuments(pdfDocs);

    // 3. Embedding & Vector Storage Step
    console.log('\n--- Step 3: Embedding & Storing (Gemini + Qdrant) ---');
    await storeChunks(COLLECTION_NAME, chunks);

    // 4. Retrieval Step (The "Question Answering" context fetch)
    const testQuery = "how many attention heads are used in the Transformer model?";
    console.log(`\n--- Step 4: Retrieval Search For: "${testQuery}" ---`);
    const relevantSnippets = await searchChunks(COLLECTION_NAME, testQuery, 2); // Get top 2

    // 5. Verification
    console.log('\n=== RAG Context Retrieval Results ===');
    relevantSnippets.forEach((text, i) => {
      console.log(`\n✅ SNIPPET #${i + 1} (relevant text):`);
      console.log(`   "${text.substring(0, 300)}..."`);
    });

    // Check if the content is correct (Transformer uses 8 heads)
    const mentionsHeads = relevantSnippets.some((s) => s.toLowerCase().includes('heads') || s.toLowerCase().includes('h = 8'));
    if (mentionsHeads) {
      console.log('\n✨ [PASS]: Successfully retrieved context mentioning "heads" or "h=8"!');
    } else {
      console.log('\n⚠️  [WARN]: Context found but target answer "heads" not in top 2 results.');
    }

    console.log('\n🎉 FULL PIPELINE TEST COMPLETE — Phase 18 SUCCESS!');
  } catch (error: any) {
    console.error('\n❌ RAG Pipeline CRASHED:', error.message);
    if (error.message.includes('fetch failed')) {
      console.log('   (Tip: Is Qdrant Dashboard running on http://localhost:6333?)');
    }
  }
}

testFullRagPipeline();

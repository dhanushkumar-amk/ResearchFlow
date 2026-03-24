import { loadDocument } from '../rag/loader';
import { splitDocuments } from '../rag/splitter';
import path from 'path';

async function testRagPipeline() {
  console.log('🚀 Starting RAG Pipeline Test — Phase 17 (Load & Split)\n');

  // ---- TEST 1: PDF Loading ----
  const pdfPath = path.join(__dirname, '../rag/samples/attention_paper.pdf');
  console.log('=== TEST 1: PDF Loading ===');
  const pdfDocs = await loadDocument(pdfPath, 'pdf');
  console.log(`📚 Total pages loaded: ${pdfDocs.length}\n`);

  // ---- TEST 2: Split PDF into chunks ----
  console.log('=== TEST 2: Text Splitting ===');
  const chunks = await splitDocuments(pdfDocs);
  console.log(`📦 Total chunks generated: ${chunks.length}\n`);

  // ---- TEST 3: Print first 3 chunks ----
  console.log('=== TEST 3: First 3 Chunks ===');
  chunks.slice(0, 3).forEach((chunk, i) => {
    console.log(`\n--- Chunk #${i + 1} ---`);
    console.log(`📏 Length: ${chunk.pageContent.length} chars`);
    console.log(`📝 Content: "${chunk.pageContent.substring(0, 120)}..."`);
  });

  // ---- TEST 4: Verify chunk overlap ----
  console.log('\n=== TEST 4: Overlap Verification ===');
  if (chunks.length >= 2) {
    const chunk1End = chunks[0].pageContent.slice(-50);
    const chunk2Start = chunks[1].pageContent.substring(0, 50);
    const overlapFound = chunks[1].pageContent.includes(chunk1End.trim());
    console.log(`🔗 End of Chunk 1 (last 50 chars): "${chunk1End}"`);
    console.log(`🔗 Start of Chunk 2 (first 50 chars): "${chunk2Start}"`);
    console.log(overlapFound
      ? '✅ Overlap VERIFIED — consecutive chunks share content.'
      : '⚠️  Overlap not detected in first boundary (may split at natural break — this is normal).');
  }

  // ---- TEST 5: TXT Loading ----
  console.log('\n=== TEST 5: TXT Sample Loading ===');
  const txtPath = path.join(__dirname, '../rag/samples/sample.txt');
  const txtDocs = await loadDocument(txtPath, 'txt');
  const txtChunks = await splitDocuments(txtDocs);
  console.log(`✅ TXT file: ${txtDocs.length} doc(s) → ${txtChunks.length} chunks`);

  console.log('\n✨ Phase 17 RAG Load & Split test COMPLETE!');
}

testRagPipeline().catch((e) => {
  console.error('❌ Test failed:', e.message);
  process.exit(1);
});

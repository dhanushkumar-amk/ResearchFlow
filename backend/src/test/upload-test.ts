import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

/**
 * Phase 33 Test: Document Upload & Retrieval
 * Verifies that a sample TXT file can be uploaded, indexed via RAG,
 * metadata-stored in Postgres, and then listed via API.
 */
async function testUploadFlow() {
  const sessionId = `test-upload-session-${Date.now()}`;
  const localTestFile = path.resolve(__dirname, 'sample_test.txt');

  // 1. Create a dummy text file
  const testContent = `
    Advanced Agentic ResearchFlow (v1.0)
    This is a test document designed to verify the Phase 33 RAG ingestion pipeline.
    It contains multiple lines to ensure the RecursiveCharacterTextSplitter 
    can properly chunk the information into at least 2 or 3 segments.
    
    Technical Details:
    - Backend: Express + TypeScript
    - Vector Store: Qdrant Cloud
    - Embeddings: Google Gemini (embedding-001)
    - Metadata Store: PostgreSQL
  `.trim();

  fs.writeFileSync(localTestFile, testContent);
  console.log(`📝 Created local test file at: ${localTestFile}`);

  try {
    // 2. Upload the file
    console.log(`\n🚀 [Step 1] Uploading to /api/documents/upload...`);
    const form = new FormData();
    form.append('file', fs.createReadStream(localTestFile));
    form.append('sessionId', sessionId);

    const uploadRes = await axios.post('http://localhost:3001/api/documents/upload', form, {
      headers: form.getHeaders(),
    });

    console.log('✅ Upload Success Response:', JSON.stringify(uploadRes.data, null, 2));
    const documentId = uploadRes.data.document.document_id;

    // 3. Verify retrieval
    console.log(`\n🔍 [Step 2] Fetching document list for sessionId: ${sessionId}...`);
    const listRes = await axios.get(`http://localhost:3001/api/documents?sessionId=${sessionId}`);
    
    console.log(`📂 Document count: ${listRes.data.length}`);
    if (listRes.data.some((d: any) => d.document_id === documentId)) {
      console.log('🏆 Document found in SQL list!');
    } else {
      throw new Error('Document ID not found in retrieval list');
    }

    // 4. Test deletion
    console.log(`\n🗑️ [Step 3] Deleting document: ${documentId}...`);
    const delRes = await axios.delete(`http://localhost:3001/api/documents/${documentId}`, {
      data: { sessionId }
    });
    console.log('✅ Deletion Success Message:', delRes.data.message);

    console.log(`\n🎉 Phase 33 Verification Successful!`);
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.response?.data || error.message);
    process.stdout.write('\nCheck server logs for detailed trace.\n');
    process.exit(1);
  } finally {
    // Cleanup the initial temp test file
    if (fs.existsSync(localTestFile)) {
      fs.unlinkSync(localTestFile);
    }
  }
}

testUploadFlow();

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;

/**
 * Splits an array of Documents into smaller chunks.
 * Uses RecursiveCharacterTextSplitter: chunkSize 500, chunkOverlap 50
 */
export async function splitDocuments(docs: Document[]): Promise<Document[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
    separators: ['\n\n', '\n', '. ', ' ', ''], // Try natural breaks first
  });

  const chunks = await splitter.splitDocuments(docs);
  console.log(`✂️  Split into ${chunks.length} chunks (size: ${CHUNK_SIZE}, overlap: ${CHUNK_OVERLAP})`);
  return chunks;
}

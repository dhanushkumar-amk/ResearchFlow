import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { Document } from '@langchain/core/documents';
import fs from 'fs/promises';

/**
 * Loads a document from disk.
 * Supports PDF and TXT file types.
 */
export async function loadDocument(filePath: string, fileType: 'pdf' | 'txt'): Promise<Document[]> {
  try {
    if (fileType === 'pdf') {
      const loader = new PDFLoader(filePath, { splitPages: true });
      return await loader.load();
    } else {
      // Direct text loading to ensure simplicity and bypass package path issues
      const content = await fs.readFile(filePath, 'utf8');
      return [new Document({ pageContent: content, metadata: { source: filePath } })];
    }
  } catch (error: any) {
    console.error(`❌ Failed to load document "${filePath}":`, error.message);
    throw error;
  }
}

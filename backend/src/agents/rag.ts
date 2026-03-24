import { searchChunks, collectionExists } from '../rag/vectorStore';
import fs from 'fs/promises';
import path from 'path';

/**
 * Agent 3: RAG Agent
 * Task: Retrieve relevant context from the vector database.
 */
export async function runRagAgent(query: string, collectionName: string) {
  const startTime = Date.now();
  console.log(`🤖 [RAG Agent] Starting retrieval for: "${query}" in collection: "${collectionName}"`);

  let contextString = '';
  let chunkCount = 0;
  let status = 'success';

  try {
    // 1. Check if the collection exists
    const exists = await collectionExists(collectionName);
    
    if (!exists) {
      console.log(`⚠️ Collection "${collectionName}" does not exist. No docs uploaded for this project yet.`);
      status = 'no_collection';
    } else {
      // 2. Search for top 5 chunks
      const results = await searchChunks(collectionName, query, 5);
      chunkCount = results.length;

      if (chunkCount === 0) {
        console.log('⚠️ No relevant chunks found in the existing collection.');
        status = 'no_results';
      } else {
        // 3. Format context string with source metadata
        contextString = 'Below is relevant context retrieved from the project knowledge base:\n\n';
        
        results.forEach((res, i) => {
          const source = res.metadata?.source ? path.basename(res.metadata.source) : 'Unknown Source';
          contextString += `--- From ${source} ---\n${res.text}\n\n`;
        });
      }
    }
  } catch (error: any) {
    console.error(`❌ RAG Agent failed:`, error.message);
    status = 'error';
    // Return empty string but don't crash the whole research flow
  }

  const duration = Date.now() - startTime;

  // Log the agent session
  const logEntry = {
    agent: 'rag',
    query,
    collectionName,
    chunkCount,
    durationMs: duration,
    status,
    timestamp: new Date().toISOString()
  };

  try {
    const logsDir = path.join(process.cwd(), 'agent_logs');
    await fs.mkdir(logsDir, { recursive: true });
    await fs.appendFile(
      path.join(logsDir, 'rag_agent.log'),
      JSON.stringify(logEntry) + '\n'
    );
  } catch (logError: any) {
    console.warn('⚠️ Failed to write RAG agent log:', logError.message);
  }

  return {
    context: contextString,
    chunkCount,
    status
  };
}

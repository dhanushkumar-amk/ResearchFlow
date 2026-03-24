import { researchGraph } from '../graph/researchGraph';
import { v4 as uuidv4 } from 'uuid';

async function testFullGraph() {
  const sessionId = uuidv4();
  const query = 'What are the key technical breakthroughs of the Attention Is All You Need paper?';

  console.log(`🚀 Starting Full Agent Orchestration for: "${query}" (Session: ${sessionId})\n`);

  try {
    const initialState = {
      query: query,
      sessionId: sessionId,
      retryCount: 0,
      status: 'starting'
    };

    // Use .stream to see node transitions if needed, or .invoke for full result
    const finalState = await researchGraph.invoke(initialState);

    console.log('\n\n========================================');
    console.log('🏁 RESEARCH COMPLETE!');
    console.log(`📊 Final Score: ${finalState.critique?.score}/10`);
    console.log(`🔄 Total Iterations: ${finalState.retryCount}`);
    console.log('========================================\n');

    // Display first 500 chars of the report
    console.log('📝 FINAL REPORT PREVIEW:');
    console.log(finalState.report.substring(0, 1000) + '...');
    
  } catch (error: any) {
    console.error('❌ Graph Execution Crashed:', error.message);
  }
}

testFullGraph();

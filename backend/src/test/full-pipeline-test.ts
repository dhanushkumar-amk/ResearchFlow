import { researchGraph } from '../graph/researchGraph';
import { v4 as uuidv4 } from 'uuid';

async function runMilestoneTest() {
  const sessionId = uuidv4();
  const query = 'What are the technical and developer experience benefits of TypeScript over JavaScript?';

  console.log('\n🌟 [MILESTONE] Starting Full End-to-End Research Pipeline Test');
  console.log(`🤖 Session ID: ${sessionId}`);
  console.log(`📝 Query: "${query}"\n`);
  console.log('------------------------------------------------------------');

  const startTime = Date.now();

  try {
    const initialState = {
      query: query,
      sessionId: sessionId,
      retryCount: 0,
      status: 'initialized'
    };

    /**
     * Using .stream() to observe node transitions in real-time.
     * This simulates how the frontend will receive updates.
     */
    const stream = await researchGraph.stream(initialState, {
       streamMode: 'updates'
    });

    for await (const update of stream) {
      // update is an object where the key is the node name and the value is the node update
      const entries = Object.entries(update);
      if (entries.length === 0) continue;

      const [nodeName, nodeData] = entries[0] as [string, any];
      
      console.log(`\n✅ NODE COMPLETED: [${nodeName.toUpperCase()}]`);
      
      if (nodeName === 'planner') {
        console.log(`🔎 Plan Generated (${nodeData.researchPlan.length} chars)`);
      } else if (nodeName === 'researcher') {
        console.log(`🌐 Web search finished. Found ${nodeData.searchResults?.split('\n\n').length || 0} snippets.`);
      } else if (nodeName === 'rag') {
        console.log(`📄 Document retrieval finished. Context length: ${nodeData.ragResults?.length || 0}`);
      } else if (nodeName === 'synthesizer') {
        console.log(`✍️  Draft Report Generated. Length: ${nodeData.report?.length} characters.`);
      } else if (nodeName === 'critic') {
        const critique = nodeData.critique;
        console.log(`⚖️  Review Outcome: [${critique.verdict.toUpperCase()}] (Score: ${critique.score}/10)`);
        if (critique.verdict === 'revise') {
          console.log(`⚠️  Issues Found: ${critique.issues.join(', ')}`);
          console.log(`💡 Suggestion: ${critique.suggestions[0]}`);
        }
      }
    }

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Get the final state to print the full report
    const finalState = await researchGraph.invoke(initialState);

    console.log('\n------------------------------------------------------------');
    console.log(`🏆 [SUCCESS] Pipeline Finished in ${totalDuration}s`);
    console.log(`📊 Final Grade: ${finalState.critique?.score}/10`);
    console.log(`🔄 Total Refinement Rounds: ${finalState.retryCount - 1}`);
    console.log('------------------------------------------------------------\n');

    console.log('📖 FINAL RESEARCH REPORT:');
    console.log('============================================================');
    console.log(finalState.report);
    console.log('============================================================\n');

  } catch (error: any) {
    console.error('\n❌ [CRITICAL ERROR] Pipeline Failed:', error.message);
    if (error.stack) console.error(error.stack);
  }
}

runMilestoneTest();

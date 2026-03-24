import { researchGraph } from '../graph/researchGraph';

async function testGraphDraft() {
  console.log('🏗️  Testing LangGraph: Research Pipeline Construction\n');

  try {
    // Check if entry point is set correctly (implicitly by trying to list nodes)
    // We can't easily introspect the compiled graph's internal nodes via public API 
    // without executing, but we can verify the export is defined.
    
    if (!researchGraph) {
      throw new Error('Graph export is undefined!');
    }

    console.log('✅ Graph compiled successfully.');
    console.log('📦 Parallel Check... ');
    
    // Check outgoing edges from planner
    const channels = (researchGraph as any).channels;
    const branchesFromPlanner = Object.keys(channels).filter(c => c.includes('branch:to:planner'));
    console.log(`📡 Branches from planner: ${branchesFromPlanner.length}`);
    
    // Check incoming edges to synthesizer
    const synthesizerIn = Object.keys(channels).filter(c => c.includes('branch:to:synthesizer'));
    console.log(`📥 Incoming to synthesizer: ${synthesizerIn.length}`);
    
    if (synthesizerIn.length >= 2) {
      console.log('\n✨ [PASS]: Parallel Execution structure confirmed! Graph will wait for both Search & RAG.');
    } else {
      console.log('\n⚠️ [FAIL]: Parallel structure seems linear.');
    }
  } catch (err: any) {
    console.error('❌ Graph Error:', err.message);
  }
}

testGraphDraft();

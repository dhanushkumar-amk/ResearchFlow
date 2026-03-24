import { StateGraph, END } from '@langchain/langgraph';
import { ResearchState, ResearchStateType } from './state';

// Import our 5 Agents
import { runPlannerAgent } from '../agents/planner';
import { runSearchAgent } from '../agents/search';
import { runRagAgent } from '../agents/rag';
import { runSynthesizerAgent } from '../agents/synthesizer';
import { runCriticAgent } from '../agents/critic';
import { emitResearchEvent } from '../events/emitter';

/**
 * Node 1: Planner Node
 * Generates the research plan based on the original query.
 */
async function plannerNode(state: ResearchStateType) {
  const planObj = await runPlannerAgent(state.query, state.sessionId);

  // Convert JSON to a readable text summary for the Synthesizer
  const formattedPlan = `
Research Tasks:
${planObj.tasks.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Queries targeted:
${planObj.search_queries.join(', ')}

Type: ${planObj.question_type} | Complexity: ${planObj.estimated_complexity}
  `.trim();

  // Emit plan for the UI
  if (state.sessionId) {
    emitResearchEvent(state.sessionId, 'plan', { plan: formattedPlan });
  }

  return { researchPlan: formattedPlan, status: 'planning_complete' };
}

/**
 * Node 2: Researcher Node (Web Search)
 */
async function researcherNode(state: ResearchStateType) {
  console.log(`⏱️ [Researcher Start] ${new Date().toISOString()}`);
  const result = await runSearchAgent(state.query);
  return { searchResults: result };
}

/**
 * Node 3: RAG Node (Document Search)
 */
async function ragNode(state: ResearchStateType) {
  console.log(`⏱️ [RAG Start] ${new Date().toISOString()}`);
  
  // Important: Match the collection name logic from ingest.ts
  const collectionName = `session_docs_${(state.sessionId || 'anonymous').replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  const result = await runRagAgent(state.query, collectionName);
  return { ragResults: result.context };
}

/**
 * Node 4: Synthesizer Node
 * Combines all findings into a structured report.
 */
async function synthesizerNode(state: ResearchStateType) {
  const generator = runSynthesizerAgent({
    query: state.query,
    researchPlan: state.researchPlan,
    webResults: state.searchResults,
    ragContext: state.ragResults,
    sessionId: state.sessionId,
  });

  let fullContent = '';
  // Collect full stream for graph logic
  for await (const chunk of generator) {
    fullContent += chunk;
    // Emit tokens for Phase 32 live streaming
    if (state.sessionId) {
      emitResearchEvent(state.sessionId, 'token', { text: chunk });
    }
  }

  return {
    report: fullContent,
    status: 'synthesis_complete',
    retryCount: (state.retryCount || 0) + 1 // Increment iteration count
  };
}

/**
 * Node 5: Critic Node
 * Evaluates the report and determines if a revision is needed.
 */
async function criticNode(state: ResearchStateType) {
  const result = await runCriticAgent({
    synthesizedReport: state.report,
    originalQuery: state.query,
    researchPlan: state.researchPlan,
    attemptNumber: state.retryCount,
  });

  return { critique: result, status: 'review_complete' };
}

/**
 * CONSTRUCTION OF THE GRAPH
 */
const workflow = new StateGraph(ResearchState)
  .addNode('planner', plannerNode)
  .addNode('researcher', researcherNode)
  .addNode('rag', ragNode)
  .addNode('synthesizer', synthesizerNode)
  .addNode('critic', criticNode);

// Define the Entry Point
workflow.setEntryPoint('planner');

// Define Parallel Forks
workflow.addEdge('planner', 'researcher');
workflow.addEdge('planner', 'rag');

// Define the Join (LangGraph waits for both branches to complete before synthesizer)
workflow.addEdge('researcher', 'synthesizer');
workflow.addEdge('rag', 'synthesizer');

// Define the Linear Progress from Synthesis to Review
workflow.addEdge('synthesizer', 'critic');

// Define Conditional Logic (The Re-write Loop)
workflow.addConditionalEdges(
  'critic',
  (state: ResearchStateType) => {
    if (state.critique?.verdict === 'approve') {
      return 'end';
    } else {
      return 'synthesize';
    }
  },
  {
    end: END,
    synthesize: 'synthesizer', // Loop back to synthesize for revision
  }
);

// Compile the Graph
export const researchGraph = workflow.compile();

console.log('🏗️  LangGraph: Research Pipeline Constructed Successfully!');

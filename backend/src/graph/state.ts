import { Annotation } from '@langchain/langgraph';

/**
 * Phase 22: LangGraph Research State
 * This defines the shared memory used by all agents in the pipeline.
 * Each channel manages how updates are merged.
 */
export const ResearchState = Annotation.Root({
  // Main Input
  query: Annotation<string>(),
  sessionId: Annotation<string>(),
  userId: Annotation<string>(),

  // Processed artifacts (Last-write-wins)
  researchPlan: Annotation<string>(),
  searchResults: Annotation<string>(),
  ragResults: Annotation<string>(),
  report: Annotation<string>(),

  // Critique metadata (Agent 5 evaluation)
  critique: Annotation<{
    score: number;
    issues: string[];
    suggestions: string[];
    verdict: 'approve' | 'revise';
  }>(),

  // Retry counter (Uses an addition reducer to keep track of iterations)
  // Each node that wants to increment should return { retryCount: 1 }
  retryCount: Annotation<number>({
    reducer: (x, y) => x + y, // x is current state, y is the new value provided by the node
    default: () => 0,
  }),

  // State flags & Errors
  status: Annotation<string>(),
  error: Annotation<string | null>(),
});

/**
 * Type helper for use in node logic
 */
export type ResearchStateType = typeof ResearchState.State;

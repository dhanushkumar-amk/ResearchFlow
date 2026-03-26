import { EventEmitter } from 'events';

/**
 * Global Event Emitter for research progress.
 * Used to bridge LangGraph node updates (including tokens) to the SSE controllers.
 */
class ResearchEmitter extends EventEmitter {}

export const researchEmitter = new ResearchEmitter();

/**
 * Unified event helper for the research pipeline.
 * Emits global 'update', 'complete', or 'error' events for the SSE routers to pick up.
 */
export const emitResearchEvent = (sessionId: string, eventType: 'update' | 'complete' | 'error' | 'plan' | 'sources' | 'report' | 'status', data: any) => {
  // Map specific types to the main SSE categories
  let category = 'update';
  if (eventType === 'complete' || eventType === 'error') {
    category = eventType;
  }

  // Preserve the internal type for the frontend to discriminate
  researchEmitter.emit(category, {
    sessionId,
    type: eventType,
    data
  });
};

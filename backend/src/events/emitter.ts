import { EventEmitter } from 'events';

/**
 * Global Event Emitter for research progress.
 * Used to bridge LangGraph node updates (including tokens) to the SSE controllers.
 */
class ResearchEmitter extends EventEmitter {}

export const researchEmitter = new ResearchEmitter();

// Type-safe event helper
export const emitResearchEvent = (sessionId: string, type: string, data: any) => {
  researchEmitter.emit(`research:${sessionId}`, { type, data });
};

import { ChatGroq } from '@langchain/groq';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { config } from '../config';
import { logAgentActivity } from '../db/queries';
import { callMcpTool } from '../mcp/toolClient';

// Define the interface for the planner's output
export interface PlannerOutput {
  tasks: string[];
  search_queries: string[];
  question_type: 'factual' | 'analytical' | 'opinion';
  estimated_complexity: 'easy' | 'medium' | 'hard';
}

/**
 * Planner Agent (Agent 1) - Phase 30 Updated
 * Responsible for breaking down a complex query into actionable research tasks.
 * Uses MCP tool `save_memory` to store intermediate planning data.
 */
export async function runPlannerAgent(query: string, sessionId?: string): Promise<PlannerOutput> {
  const startTime = Date.now();
  
  // Initialize the Groq LLM - USES INSTANT MODEL for sub-second planning
  const llm = new ChatGroq({
    apiKey: config.groqApiKey,
    model: 'llama-3.1-8b-instant',
    temperature: 0,
  });

  // Initialize the JSON parser
  const parser = new JsonOutputParser<PlannerOutput>();

  const prompt = PromptTemplate.fromTemplate(
    `You are a research planning expert. 
    Break this research question into 3-5 sub-tasks and 5 optimized search queries.
    
    Return ONLY JSON:
    {{
      "tasks": ["task 1", "task 2"],
      "search_queries": ["query 1", "query 2"],
      "question_type": "factual | analytical | opinion",
      "estimated_complexity": "easy | medium | hard"
    }}

    Question: {question}`
  );

  const chain = prompt.pipe(llm).pipe(parser);

  try {
    const result = await chain.invoke({
      question: query,
    });

    const durationMs = Date.now() - startTime;

    // Direct Database logging only (Minimal overhead)
    if (sessionId) {
      logAgentActivity(
        sessionId,
        'planner',
        query.substring(0, 500),
        JSON.stringify(result).substring(0, 500),
        durationMs,
        0
      ).catch(() => {});
    }

    return result;
  } catch (error) {
    console.error('❌ Planner Agent Error:', error);
    throw error;
  }
}

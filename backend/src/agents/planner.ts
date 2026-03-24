import { ChatGroq } from '@langchain/groq';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { config } from '../config';
import { logAgentActivity } from '../db/queries';

// Define the interface for the planner's output
export interface PlannerOutput {
  tasks: string[];
  search_queries: string[];
  question_type: 'factual' | 'analytical' | 'opinion';
  estimated_complexity: 'easy' | 'medium' | 'hard';
}

/**
 * Planner Agent (Agent 1)
 * Responsible for breaking down a complex query into actionable research tasks and search queries.
 */
export async function runPlannerAgent(query: string, sessionId?: string): Promise<PlannerOutput> {
  const startTime = Date.now();
  
  // Initialize the Groq LLM
  const llm = new ChatGroq({
    apiKey: config.groqApiKey,
    model: 'llama-3.3-70b-versatile',
    temperature: 0, // Deterministic for planning
  });

  // Initialize the JSON parser
  const parser = new JsonOutputParser<PlannerOutput>();

  // Construct the system prompt
  const prompt = PromptTemplate.fromTemplate(
    `You are a world-class research planning expert. 
    Your goal is to take a research question and create a high-level execution plan.
    
    Instructions:
    1. Break the question into 3-5 specific sub-tasks/questions.
    2. Generate 5-6 optimized search queries for web search.
    3. Determine the type of question: factual, analytical, or opinion.
    4. Estimate the research complexity: easy, medium, or hard.
    
    Return ONLY a valid JSON object matching the following structure:
    {{
      "tasks": ["task 1", "task 2"],
      "search_queries": ["query 1", "query 2"],
      "question_type": "factual | analytical | opinion",
      "estimated_complexity": "easy | medium | hard"
    }}

    {format_instructions}
    
    User Question: {question}`
  );

  // Link the chain using LCEL
  const chain = prompt.pipe(llm).pipe(parser);

  try {
    // Execute the planning chain
    const result = await chain.invoke({
      question: query,
      format_instructions: parser.getFormatInstructions(),
    });

    const durationMs = Date.now() - startTime;

    // Log the activity to the database if a sessionId is provided
    if (sessionId) {
      try {
        await logAgentActivity(
          sessionId,
          'planner',
          query.substring(0, 500), // Input summary
          JSON.stringify(result).substring(0, 500), // Output summary
          durationMs,
          0 // Token count placeholder for now
        );
      } catch (logError) {
        console.warn('⚠️ Warning: Failed to log agent activity to DB:', logError);
      }
    }

    return result;

  } catch (error) {
    console.error('❌ Planner Agent Error:', error);
    throw error;
  }
}

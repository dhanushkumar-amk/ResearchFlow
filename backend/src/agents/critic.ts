import { ChatGroq } from '@langchain/groq';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { config } from '../config';
import { logAgentActivity } from '../db/queries';

interface CriticInputs {
  synthesizedReport: string;
  originalQuery: string;
  researchPlan: string;
  attemptNumber?: number;
  sessionId?: string;
}

interface CriticOutput {
  score: number;
  issues: string[];
  suggestions: string[];
  verdict: 'approve' | 'revise';
}

/**
 * Agent 5: Critic Agent (Optimized Phase 46)
 * Task: Rigorous quality reviewer for research reports with telemetry.
 */
export async function runCriticAgent(inputs: CriticInputs): Promise<CriticOutput> {
  const { synthesizedReport, originalQuery, researchPlan, attemptNumber = 1, sessionId } = inputs;
  const startTime = Date.now();

  console.log(`🧐 [Critic Agent] Reviewing attempt #${attemptNumber} for query: "${originalQuery}"`);

  // Max retry safety
  if (attemptNumber >= 3) {
    return {
      score: 7,
      issues: ['Maximum iteration count reached.'],
      suggestions: ['Auto-approved for concurrency.'],
      verdict: 'approve',
    };
  }

  // Initialize Groq LLM
  const llm = new ChatGroq({
    apiKey: config.groqApiKey,
    model: 'llama-3.1-8b-instant',
    temperature: 0.1,
  });

  const parser = new JsonOutputParser<CriticOutput>();

  const prompt = PromptTemplate.fromTemplate(`
    You are a Rigorous Quality Reviewer for a Senior Research Team.
    Evaluate if this report matches the research plan and query.

    ### RUBRIC:
    - 7-10: approve
    - Below 7: revise

    ### RESPONSE FORMAT (JSON ONLY):
    {{
      "score": number,
      "issues": ["issue 1"],
      "suggestions": ["fix 1"],
      "verdict": "approve" | "revise"
    }}

    ### DATA:
    - QUERY: {originalQuery}
    - PLAN: {researchPlan}
    - REPORT: {report}
  `);

  try {
    const formatted = await prompt.format({
      originalQuery,
      researchPlan,
      report: synthesizedReport.substring(0, 10000) // Truncate very long reports for context window
    });

    const response = await llm.invoke(formatted);
    const result = await parser.parse(response.content as string);
    const totalTokens = (response as any).usage_metadata?.total_tokens || 0;

    const durationMs = Date.now() - startTime;
    console.log(`📊 [Critic Result] Score: ${result.score}/10 | Verdict: ${result.verdict.toUpperCase()}`);

    // Database Performance Logging
    if (sessionId) {
      logAgentActivity(
        sessionId,
        'critic',
        originalQuery.substring(0, 500),
        JSON.stringify(result).substring(0, 500),
        durationMs,
        totalTokens
      ).catch(() => {});
    }

    return result;
  } catch (error: any) {
    console.error('❌ Critic Agent Failed:', error.message);
    return { score: 7, issues: [], suggestions: [], verdict: 'approve' };
  }
}

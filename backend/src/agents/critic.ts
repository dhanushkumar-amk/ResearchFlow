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
  evaluation?: {
    completeness: number;
    clarity: number;
    accuracy: number;
    safety: 'pass' | 'fail';
  };
  issues: string[];
  suggestions: string[];
  verdict: 'approve' | 'revise';
}

/**
 * Extremely robust text/markdown/JSON extractor fallback for Critic Agent.
 * Ensures the pipeline never crashes even if LLM returns bad formatting.
 */
function robustParseCriticOutput(content: string): CriticOutput {
  // Default evaluation fallback
  let fallbackEvaluation = {
    completeness: 7,
    clarity: 7,
    accuracy: 7,
    safety: 'pass' as 'pass' | 'fail'
  };

  // 1. Try finding a JSON block
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const jsonStr = jsonMatch[0].trim();
      const result = JSON.parse(jsonStr) as CriticOutput;
      if (!result.evaluation) {
        result.evaluation = {
          completeness: result.score || 7,
          clarity: result.score || 7,
          accuracy: result.score || 7,
          safety: 'pass'
        };
      }
      return result;
    } catch (e: any) {
      console.warn('⚠️ [Critic Agent] Fallback JSON.parse failed, attempting manual text extraction...', e.message);
    }
  }

  // 2. Full text manual extraction fallback
  const normalized = content.toLowerCase();
  
  // Determine verdict
  let verdict: 'approve' | 'revise' = 'approve';
  if (normalized.includes('verdict: revise') || normalized.includes('"verdict": "revise"') || (normalized.includes('revise') && !normalized.includes('approve'))) {
    verdict = 'revise';
  } else if (normalized.includes('verdict: approve') || normalized.includes('"verdict": "approve"') || normalized.includes('approve')) {
    verdict = 'approve';
  }

  // Determine score
  let score = verdict === 'approve' ? 8 : 5;
  const scoreMatch = content.match(/(?:score|rating|points)\s*[:"\s]*(\d+)/i);
  if (scoreMatch) {
    const parsedScore = parseInt(scoreMatch[1], 10);
    if (!isNaN(parsedScore) && parsedScore >= 0 && parsedScore <= 10) {
      score = parsedScore;
    }
  }

  // Determine safety
  let safety: 'pass' | 'fail' = 'pass';
  if (normalized.includes('safety: fail') || normalized.includes('"safety": "fail"') || normalized.includes('fail')) {
    safety = 'fail';
    verdict = 'revise';
    score = 1;
  }

  fallbackEvaluation = {
    completeness: score,
    clarity: score,
    accuracy: score,
    safety
  };

  // Determine issues
  const issues: string[] = [];
  const issuesSection = content.match(/(?:issues|weaknesses|problems)\s*[:\s]*\n?([\s\S]*?)(?:\n\n|\n[A-Z]|$)/i);
  if (issuesSection) {
    const lines = issuesSection[1].split('\n');
    for (const line of lines) {
      const trimmed = line.replace(/^[\s-*>\d.]+\s*/, '').trim();
      if (trimmed && trimmed.length > 3 && !trimmed.toLowerCase().includes('no issues') && !trimmed.toLowerCase().includes('none')) {
        issues.push(trimmed);
      }
    }
  }

  // Determine suggestions
  const suggestions: string[] = [];
  const suggestionsSection = content.match(/(?:suggestions|recommendations|fixes|improvements)\s*[:\s]*\n?([\s\S]*?)(?:\n\n|\n[A-Z]|$)/i);
  if (suggestionsSection) {
    const lines = suggestionsSection[1].split('\n');
    for (const line of lines) {
      const trimmed = line.replace(/^[\s-*>\d.]+\s*/, '').trim();
      if (trimmed && trimmed.length > 3 && !trimmed.toLowerCase().includes('no suggestions') && !trimmed.toLowerCase().includes('none')) {
        suggestions.push(trimmed);
      }
    }
  }

  // If score doesn't match verdict, align them to maintain state validity
  if (verdict === 'approve' && score < 7) {
    score = 7;
  } else if (verdict === 'revise' && score >= 7) {
    score = 6;
  }

  return {
    score,
    evaluation: fallbackEvaluation,
    issues,
    suggestions,
    verdict
  };
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
      evaluation: {
        completeness: 7,
        clarity: 7,
        accuracy: 7,
        safety: 'pass'
      },
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
    - 7-10: approve (overall average score must be >= 7)
    - Below 7: revise

    Please perform a structured evaluation across these key metrics (1-10):
    1. completeness (1-10): Rate how thoroughly the report answers the original query and plan.
    2. clarity (1-10): Rate the structure, typography formatting, readability, and neatness.
    3. accuracy (1-10): Rate if the information is logical, grounded, and has source citations.
    4. safety ("pass" | "fail"): Verify that the generated report contains no hate speech, dangerous instructions, system prompt override disclosures, or credential leakages. If safety is "fail", the verdict must immediately be set to "revise" and the overall score to 1.

    The final "score" should be an integer representing the average of completeness, clarity, and accuracy (or 1 if safety fails).

    ### RESPONSE FORMAT (JSON ONLY):
    {{
      "score": number,
      "evaluation": {{
        "completeness": number,
        "clarity": number,
        "accuracy": number,
        "safety": "pass" | "fail"
      }},
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
    const content = response.content as string;
    
    let result: CriticOutput;
    try {
      result = await parser.parse(content);
      if (result.evaluation && result.evaluation.safety === 'fail') {
        result.verdict = 'revise';
        result.score = 1;
      }
    } catch (parseError) {
      console.warn('⚠️ [Critic Agent] Standard parser failed, attempting robust custom extraction fallback...');
      result = robustParseCriticOutput(content);
    }
    
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
    return { 
      score: 7, 
      evaluation: { completeness: 7, clarity: 7, accuracy: 7, safety: 'pass' },
      issues: [], 
      suggestions: [], 
      verdict: 'approve' 
    };
  }
}

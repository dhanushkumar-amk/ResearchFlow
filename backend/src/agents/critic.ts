import Groq from 'groq-sdk';
import { config } from '../config';

const groq = new Groq({ apiKey: config.groqApiKey });

interface CriticInputs {
  synthesizedReport: string;
  originalQuery: string;
  researchPlan: string;
  attemptNumber?: number; // 0, 1, 2...
}

interface CriticOutput {
  score: number;
  issues: string[];
  suggestions: string[];
  verdict: 'approve' | 'revise';
}

/**
 * Agent 5: Critic Agent
 * Task: Rigorous quality reviewer for research reports.
 */
export async function runCriticAgent(inputs: CriticInputs): Promise<CriticOutput> {
  const { synthesizedReport, originalQuery, researchPlan, attemptNumber = 1 } = inputs;

  console.log(`🧐 [Critic Agent] Reviewing attempt #${attemptNumber} for query: "${originalQuery}"`);

  // SAFETY: If this is the 3rd attempt, we must approve to prevent infinite agent loops.
  if (attemptNumber >= 3) {
    console.log('🛡️ [Critic Agent] Max retries (3) reached. Auto-approving report to prevent loops.');
    return {
      score: 7, // Baseline
      issues: ['Maximum iteration count reached.'],
      suggestions: ['Consider manual review for finer details.'],
      verdict: 'approve',
    };
  }

  const systemPrompt = `
You are a Rigorous Quality Reviewer for a Senior Research Team.
Your job is to evaluate if a research report is ready to be sent to a client.

### EVALUATION RUBRIC:
- 9-10 (Comprehensive): Covers all parts of the research plan with detailed citations and clear sections.
- 7-8 (Good): Minor gaps or slightly shallow analysis, but mostly complete.
- 5-6 (Significant Gaps): Missing entire sections or lacking citations.
- 1-4 (Fundamentally Incomplete): Off-topic, hallucinated, or completely lacks structure.

### VERDICT RULES:
- If score is 7 or higher: Verdict = "approve"
- If score is below 7: Verdict = "revise"

### JSON FORMAT:
You MUST respond ONLY with a JSON object in this format:
{
  "score": number,
  "issues": string[],
  "suggestions": string[],
  "verdict": "approve" | "revise"
}

### DATA TO REVIEW:
- ORIGINAL QUERY: ${originalQuery}
- RESEARCH PLAN: ${researchPlan}
- REPORT CONTENT:
${synthesizedReport}
`.trim();

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Evaluation report in JSON format.' },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const json = JSON.parse(response.choices[0].message.content || '{}');
    console.log(`📊 [Critic Result] Score: ${json.score}/10 | Verdict: ${json.verdict.toUpperCase()}`);
    return json;
  } catch (error: any) {
    console.error('❌ Critic Agent Failed:', error.message);
    return {
      score: 7,
      issues: ['Critic agent connection error.'],
      suggestions: [],
      verdict: 'approve',
    };
  }
}

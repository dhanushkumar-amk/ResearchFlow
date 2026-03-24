import Groq from 'groq-sdk';
import { config } from '../config';

const groq = new Groq({ apiKey: config.groqApiKey });

interface SynthesizerInputs {
  query: string;
  researchPlan: string;
  webResults: string;
  ragContext: string;
}

/**
 * Agent 4: Synthesizer Agent
 * Task: Synthesize all research findings (Web + Documents) into a professional report.
 * Uses Groq Streaming for a reactive user experience.
 */
export async function* runSynthesizerAgent(inputs: SynthesizerInputs): AsyncGenerator<string> {
  const { query, researchPlan, webResults, ragContext } = inputs;

  console.log('📝 [Synthesizer Agent] Generating final report via Groq streaming...');

  const systemPrompt = `
You are a Senior Research Analyst. Your task is to synthesize all research findings into a high-quality, professional report.

### CONTEXT PROVIDED:
1. ORIGINAL USER QUERY: ${query}
2. RESEARCH PLAN: ${researchPlan}
3. WEB SEARCH FINDINGS: 
${webResults}
4. PRIVATE KNOWLEDGE BASE (RAG):
${ragContext}

### INSTRUCTIONS:
- Create a structured MARKDOWN report.
- SECTIONS REQUIRED:
  1. Executive Summary: High-level overview of the findings.
  2. Key Findings: Bullet points of the most important takeaways.
  3. Detailed Analysis: Deep dive into the topic, connecting web data with document context.
  4. Contradictions & Gaps: Explicitly flag if web data disagrees with your knowledge base or if info is missing.
  5. Sources: List URLs and Document names cited.
  6. Conclusion: Actionable final thoughts.

- CITATIONS: Always cite sources in brackets like [Source Name/URL] next to the fact.
- TONE: Professional, objective, and analytical.
- CONSTRAINTS: Use ONLY the provided information. Do not hallucinate external facts.
- FORMATTING: Use bolding, bullet points, and clear headers for readability.
`.trim();

  try {
    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Generate the final research report now.' },
      ],
      temperature: 0.3,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  } catch (error: any) {
    console.error('❌ Synthesizer Agent Error:', error.message);
    yield `\n\nERROR during synthesis: ${error.message}. Please check your API key or connection.`;
  }
}

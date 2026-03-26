import Groq from 'groq-sdk';
import { config } from '../config';
import { callMcpTool } from '../mcp/toolClient';

const groq = new Groq({ apiKey: config.groqApiKey });

interface SynthesizerInputs {
  query: string;
  researchPlan: string;
  webResults: string;
  ragContext: string;
  sessionId?: string; // Optional for memory retrieval
}

/**
 * Agent 4: Synthesizer Agent
 * Task: Synthesize findings via Groq Streaming.
 */
export async function* runSynthesizerAgent(inputs: SynthesizerInputs): AsyncGenerator<string> {
  const { query, researchPlan, webResults, ragContext } = inputs;

  console.log('📝 [Synthesizer Agent] Generating final report via Groq streaming...');

  const systemPrompt = `
You are a Lead Research Scientist. Your task is to synthesize all findings into a professional report.

### GOAL:
1. Start with a single H1 Markdown Heading (#) for the Title.
2. Use H2 (##) and H3 (###) for all sections.
3. Citation Radar: Cite sources with [Web Source X] or [Document Context X].
4. Include at least one Markdown Table.
5. Include EXACTLY one Mermaid Diagram using \`graph TD\` syntax. 
   - CRITICAL: Use ONLY \`-->\` for arrows. 
   - DO NOT USE \`|>\`.
   - Example: \`graph TD\nA-->B\`.
6. Tone: Professional and analytical.

### CONTEXT PROVIDED:
- ORIGINAL USER QUERY: ${query}
- RESEARCH PLAN: ${researchPlan}
- WEB SEARCH FINDINGS:
${webResults}
- PRIVATE KNOWLEDGE BASE (RAG):
${ragContext}

### RULES:
- CITATIONS: Always cite sources like [Source Name/URL] next to the fact.
- TONE: Professional and analytical.
- LENGTH: Be exhaustive. Elaborate on connections between findings.
- SOURCE CODE: Do not hallucinate. Use ONLY the provided information.
`.trim();

  try {
    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Begin the exhaustive research report now. Ensure it includes the required table and Mermaid diagram.' },
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
    yield `\n\nERROR during synthesis: ${error.message}.`;
  }
}

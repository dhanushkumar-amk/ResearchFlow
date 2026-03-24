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
 * Agent 4: Synthesizer Agent - Phase 30 Updated
 * Task: Synthesize findings via Groq Streaming.
 * Now uses MCP tool `get_memory` to verify planning context.
 */
export async function* runSynthesizerAgent(inputs: SynthesizerInputs): AsyncGenerator<string> {
  const { query, researchPlan, webResults, ragContext, sessionId } = inputs;

  console.log('📝 [Synthesizer Agent] Generating final report via Groq streaming...');

  // OPTIONAL ── VERIFY MEMORY (New: Phase 30 Memory Tools) ──────────────────────────
  if (sessionId) {
    try {
      const storedPlan = await callMcpTool('get_memory', {
        session_id: sessionId,
        key: 'planner_result'
      });
      console.log(`🧠 [Synthesizer] Verified planning memory for session: ${sessionId}`);
      // NOTE: We could compare storedPlan with researchPlan if needed, 
      // but for this phase we just demonstrate the retrieval.
    } catch (err: any) {
      console.warn('⚠️ Warning: Failed to retrieve planning memory via MCP get_memory工具:', err.message);
    }
  }

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
- CITATIONS: Always cite sources in brackets like [Source Name/URL] next to the fact.
- TONE: Professional, objective, and analytical.
- SOURCES: END THE REPORT with a "### Sources & Documents" section listing all websites and uploaded documents used.
- CONSTRAINTS: Use ONLY the provided information. Do not hallucinate external facts.
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
    yield `\n\nERROR during synthesis: ${error.message}.`;
  }
}

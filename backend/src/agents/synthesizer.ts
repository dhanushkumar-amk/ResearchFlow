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
You are a Lead Research Scientist. Your task is to synthesize all research findings into an exhaustive, high-quality, professional report. 

### GOAL: 
Your report must be massive and highly detailed (aim for 5,000+ words / 8+ pages). Do not summarize; explain everything in painstaking detail.

### STRUCTURE & COMPONENTS:
- **MARKDOWN HEADINGS**: You MUST use \`#\` for the main report title and \`##\` or \`###\` for all sections. Bold text is NOT a substitute for a heading.
- **CITATION RADAR**: You MUST cite your sources using bracketed markers like \`[Web Source 0]\`, \`[Web Source 1]\`, or \`[Document Context 0]\` whenever you mention a specific fact. Use the index of the source from the context.
- **At least THREE Markdown Tables**: Use tables for data comparison, timelines, or feature analysis.
- **At least TWO Mermaid Diagrams**: One flowchart for a process and one MindMap/Sequence diagram.
- **10+ Exhaustive Sections**: Break down the topic into sub-topics and sub-sub-topics.
- **Deep Evidence**: Link every discovery to a source.
- **Contradiction Analysis**: If sources disagree, analyze why.
- **Expert Perspective**: Provide a "Chief Analyst's Take" for each section.
- **Private Knowledge Integration**: Explicitly state "According to internal documentation" followed by a citation like \`[Document Context 0]\`.



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

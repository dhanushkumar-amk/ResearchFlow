import { ChatGroq } from '@langchain/groq';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { config } from '../config';
import { logAgentActivity } from '../db/queries';

interface SynthesizerInputs {
  query: string;
  researchPlan: string;
  webResults: string;
  ragContext: string;
  sessionId?: string; 
}

/**
 * Agent 4: Synthesizer Agent (Optimized Phase 46)
 * Task: Synthesize findings via Groq Streaming with integrated telemetry.
 */
export async function* runSynthesizerAgent(inputs: SynthesizerInputs): AsyncGenerator<string> {
  const { query, researchPlan, webResults, ragContext, sessionId } = inputs;
  const startTime = Date.now();

  console.log('📝 [Synthesizer Agent] Generating final report via Groq streaming...');

  // Initialize the Groq LLM (LangChain version for better telemetry)
  const llm = new ChatGroq({
    apiKey: config.groqApiKey,
    model: 'openai/gpt-oss-120b',
    temperature: 0.3,
    streaming: true,
  });

  const systemPrompt = `
    You are a Lead Research Scientist. Your task is to synthesize all findings into a professional report.

    ### GOAL:
    1. Start with a single H1 Markdown Heading (#) for the Title.
    2. Use H2 (##) and H3 (###) for all sections.
    3. Citation Radar: Cite sources with [Web Source X] or [Document Context X].
    4. Include at least one Markdown Table.
    5. Include one useful Mermaid diagram. Choose graph LR for pipelines, graph TD for hierarchies, sequenceDiagram for interactions, or mindmap for concept relationships. Vary the layout to suit the subject instead of always producing a top-down hierarchy.
       - MANDATORY: Wrap the diagram in triple backticks like this: \`\`\`mermaid\ngraph TD\n...\n\`\`\`
       - CRITICAL: Use ONLY \`-->\` for arrows. 
       - DO NOT USE \`|>\`.
       - Quote every node label, including nodes defined on edges: A["Input"] --> B["Retriever (vector search)"].
       - For flowcharts, use classDef and class to distinguish stages with soft blue, teal, amber, pink, and violet fills and dark readable text.
       - Include only the diagram in the code block; omit commentary about syntax or arrows from the report.
    6. Tone: Professional and analytical.

    ### CONTEXT PROVIDED:
    - ORIGINAL USER QUERY: ${query}
    - RESEARCH PLAN: ${researchPlan}
    - WEB SEARCH FINDINGS:
    ${webResults}
    - PRIVATE KNOWLEDGE BASE (RAG):
    ${ragContext}

    ### RULES:
    - CITATIONS: Always cite sources next to the fact.
    - LENGTH: Be exhaustive. Elaborate on connections between findings.
  `;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage('Begin the exhaustive research report now. Ensure it includes the required table and Mermaid diagram.'),
  ];

  let fullContent = '';
  let totalTokens = 0;

  try {
    const stream = await llm.stream(messages);

    for await (const chunk of stream) {
      if (chunk.content) {
        fullContent += chunk.content as string;
        yield chunk.content as string;
      }
      
      // Extract usage metadata if available (usually in the last chunk)
      if ((chunk as any).usage_metadata) {
        totalTokens = (chunk as any).usage_metadata.total_tokens;
      }
    }

    // POST-STREAM Performance Logging
    const durationMs = Date.now() - startTime;
    if (sessionId) {
      logAgentActivity(
        sessionId,
        'synthesizer',
        query.substring(0, 500),
        fullContent.substring(0, 500),
        durationMs,
        totalTokens
      ).catch(() => {});
    }

  } catch (error: any) {
    console.error('❌ Synthesizer Agent Error:', error.message);
    yield `\n\nERROR during synthesis: ${error.message}.`;
  }
}

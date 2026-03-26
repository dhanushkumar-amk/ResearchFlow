import { ChatGroq } from "@langchain/groq";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { config } from '../config';

/**
 * High-Performance Chat Model (Groq Llama 3.3)
 */
const model = new ChatGroq({
  apiKey: config.groqApiKey,
  model: "llama-3.3-70b-versatile",
  temperature: 0.3,
  streaming: true,
});

interface ChatInput {
  query: string;
  report: string;
  context: {
    webResults: string;
    ragResults: string;
  };
}

/**
 * Chat Agent for follow-up questions
 * Optimized for speed and context awareness using Groq infrastructure.
 */
export async function* runChatAgent(input: ChatInput) {
  const systemPrompt = `
    You are an AI Research Analyst. You just completed a comprehensive intelligence report for the user.
    Answer follow-up questions about that report or its underlying research data.

    CONTEXT:
    - GENERATED REPORT: 
    ${input.report}

    - WEB SEARCH FINDINGS:
    ${input.context.webResults}

    - PRIVATE DOCUMENT CONTEXT:
    ${input.context.ragResults}

    RULES:
    1. Base your answers on the provided context.
    2. Be concise but analytically deep.
    3. Use Markdown (bolding, lists, tables) for clarity.
    4. If the answer is not in the context, state that clearly and briefly.
  `;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(input.query),
  ];

  try {
    const stream = await model.stream(messages);

    for await (const chunk of stream) {
      if (chunk.content) {
        yield chunk.content as string;
      }
    }
  } catch (err: any) {
    console.error('❌ [Chat Agent Error]:', err.message);
    yield `I encountered an issue while processing your follow-up. Error: ${err.message}`;
  }
}

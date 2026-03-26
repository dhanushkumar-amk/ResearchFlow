import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

const model = new ChatOpenAI({
  modelName: "gpt-4o",
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
 */
export async function* runChatAgent(input: ChatInput) {
  const systemPrompt = `
    You are an expert Research AI assistant. You have just completed a massive report for the user.
    The user is now asking follow-up questions about that report or the underlying data.

    CONTEXT:
    - GENERATED REPORT: 
    ${input.report}

    - RAW WEB SEARCH RESULTS:
    ${input.context.webResults}

    - PRIVATE DOCUMENT CONTEXT:
    ${input.context.ragResults}

    RULES:
    1. Base your answers ONLY on the provided context if possible.
    2. Be concise but extremely helpful.
    3. If the user asks for more detail on a specific part of the report, use the RAW context to provide deeper insights.
    4. If you don't know the answer or it's not in the context, say so politely.
    5. You can use Markdown for formatting (bold, tables, lists).
  `;

  const messages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(input.query),
  ];

  const stream = await model.stream(messages);

  for await (const chunk of stream) {
    if (chunk.content) {
      yield chunk.content as string;
    }
  }
}

import { ChatGroq } from '@langchain/groq';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { config } from '../config';

// Define the interface for our structured output
interface ResearchPlan {
  tasks: string[];
  search_queries: string[];
  question_type: 'factual' | 'analytical' | 'opinion';
}

async function testStructuredOutput() {
  console.log('🚀 Starting Structured Output Test (Phase 13)...');

  // Initialize Groq LLM with temperature 0 for consistent structured output
  const llm = new ChatGroq({
    apiKey: config.groqApiKey,
    model: 'llama-3.3-70b-versatile',
    temperature: 0, 
  });

  // Initialize the JSON Output Parser
  const parser = new JsonOutputParser<ResearchPlan>();

  // Define the Prompt Template with clear instructions and format requirements
  const prompt = PromptTemplate.fromTemplate(
    `You are a research planning expert. 
    Analyze the user's question and break it down into a structured research plan.
    
    Instructions:
    1. Define 3-5 specific research tasks.
    2. Generate 5-6 optimized search queries for web retrieval.
    3. Categorize the question type as either factual, analytical, or opinion.
    
    Return ONLY a valid JSON object matching the schema below. No conversational text.
    
    {format_instructions}
    
    User Question: {question}`
  );

  // Link components using LCEL
  const chain = prompt.pipe(llm).pipe(parser);

  const testQuestions = [
    "What are the historical causes of the Industrial Revolution?",
    "Should artificial intelligence be regulated by the government?",
    "How do I bake a sourdough bread?"
  ];

  console.log(`🧪 Testing with 3 different types of questions...\n`);

  for (const question of testQuestions) {
    console.log(`--------------------------------------------------`);
    console.log(`❓ QUESTION: "${question}"`);
    
    try {
      // Invoke the chain
      const result = await chain.invoke({
        question: question,
        format_instructions: parser.getFormatInstructions(),
      });

      console.log("✅ PARSED SUCCESS:");
      console.log(JSON.stringify(result, null, 2));
      
      // Basic validation of the result
      if (result.tasks && result.search_queries && result.question_type) {
        console.log(`💎 Question Type Detected: ${result.question_type.toUpperCase()}`);
      }
    } catch (error) {
      console.error("❌ FAILED TO PARSE JSON FOR QUESTION:", question);
      // In a real-world multi-agent system, you might implement retry logic or a fallback here
      console.error(error);
    }
  }

  console.log(`\n✨ Structured Output Phase 13 test COMPLETE!`);
}

testStructuredOutput();

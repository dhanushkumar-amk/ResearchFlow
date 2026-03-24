import { ChatGroq } from '@langchain/groq';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { config } from '../config';

async function testLangChain() {
  try {
    console.log('🚀 Initializing LangChain test...');

    // 1. Initialize Groq LLM
    // Using Llama-3.3-70b-versatile for Groq
    const llm = new ChatGroq({
      apiKey: config.groqApiKey,
      model: 'llama-3.3-70b-versatile', // Correct model name for Groq Llama 3.3 70B
    });

    // 2. Define Prompt Template
    const prompt = PromptTemplate.fromTemplate(
      'What is {topic}? Answer in one sentence.'
    );

    // 3. Create Chain using LCEL (Pipe Operator)
    // prompt.pipe(llm).pipe(outputParser) — this is the LangChain Expression Language (LCEL)
    const outputParser = new StringOutputParser();
    const chain = prompt.pipe(llm).pipe(outputParser);

    // 4. Run the Chain
    console.log('🧠 Calling Groq with topic: "machine learning"...');
    const result = await chain.invoke({ topic: 'machine learning' });

    console.log('\n✅ Response from Groq Llama 3.3 70B:');
    console.log(result);

    console.log('\n✨ LangChain Phase 12 test PASSED!');
  } catch (error) {
    console.error('❌ LangChain test failed:', error);
  }
}

testLangChain();

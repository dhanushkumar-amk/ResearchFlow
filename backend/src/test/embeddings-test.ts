import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { TaskType } from '@google/generative-ai';
import { config } from '../config';

// Manual Cosine Similarity function
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function testEmbeddings() {
  console.log('🚀 Starting Gemini Embeddings Test (Phase 14)...');

  // Initialize Gemini Embeddings
  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: config.googleApiKey,
    model: 'gemini-embedding-001', // Note: text-embedding-004 is retired, using gemini-embedding-001 (768 dimensions)
    taskType: TaskType.RETRIEVAL_DOCUMENT,
  });

  const sentences = [
    "Machine learning is a type of AI",
    "Deep learning uses neural networks",
    "Pizza is a popular food"
  ];

  try {
    console.log('🧠 Generating embeddings for 3 sample sentences...');
    
    // Generate vectors in parallel
    const vectors = await Promise.all(
      sentences.map((sentence) => embeddings.embedQuery(sentence))
    );

    // 1. Print first 5 numbers of each vector
    sentences.forEach((sentence, index) => {
      const vector = vectors[index];
      console.log(`\n📄 Sentence: "${sentence}"`);
      console.log(`✅ Vector Size: ${vector.length}`);
      console.log(`🔢 First 5 numbers: [${vector.slice(0, 5).join(', ')}...]`);
    });

    // 2. Compare Vectors mathematically
    console.log('\n📐 Calculating Cosine Similarity...');
    
    const simML_DL = cosineSimilarity(vectors[0], vectors[1]); // ML vs Deep Learning
    const simML_Pizza = cosineSimilarity(vectors[0], vectors[2]); // ML vs Pizza

    console.log(`🔹 Similarity (ML vs Deep Learning): ${simML_DL.toFixed(4)}`);
    console.log(`🔹 Similarity (ML vs Pizza): ${simML_Pizza.toFixed(4)}`);

    // 3. Logic check: ML should be closer to Deep Learning than to Pizza
    if (simML_DL > simML_Pizza) {
      console.log('\n✅ SUCCESS: ML and Deep Learning are mathematically more similar than ML and Pizza.');
    } else {
      console.log('\n⚠️ WARNING: Similarity check returned unexpected results.');
    }

    console.log('\n✨ Gemini Embeddings Phase 14 test COMPLETE!');
  } catch (error) {
    console.error('❌ Embeddings test failed:', error);
  }
}

testEmbeddings();

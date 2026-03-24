import { runPlannerAgent, PlannerOutput } from '../agents/planner';
import { createSession } from '../db/queries';

async function testPlannerAgent() {
  console.log('🚀 Starting Planner Agent Test (Phase 15)...');

  // Define 5 questions from different domains
  const testQuestions = [
    "What caused the fall of the Roman Empire?", // History
    "How do mRNA vaccines work?", // Science
    "How will quantum computing impact cryptography?", // Tech
    "What are the likely economic effects of Universal Basic Income?", // Economics
    "Is human consciousness a physical phenomenon?", // philosophy
  ];

  try {
    // 1. Create a single test session in the database
    console.log('📦 Creating a test research session...');
    const session = await createSession(null, 'Phase 15 Test Suite');
    const sessionId = session.session_id;
    console.log(`✅ Session Created: ${sessionId}\n`);

    // 2. Iterate through test questions
    for (const [index, question] of testQuestions.entries()) {
      console.log(`--------------------------------------------------`);
      console.log(`🧪 TEST #${index + 1}: "${question}"`);
      
      const startTime = Date.now();
      const plan = await runPlannerAgent(question, sessionId);
      const duration = Date.now() - startTime;

      // 3. Log results to console
      console.log(`⏱️ Duration: ${duration}ms`);
      console.log(`📊 Question Type: ${(plan.question_type || 'unknown').toUpperCase()}`);
      console.log(`📶 Complexity: ${(plan.estimated_complexity || 'unknown').toUpperCase()}`);
      console.log(`📝 Tasks: ${plan.tasks?.length || 0}`);
      console.log(`🔎 Queries: ${plan.search_queries?.length || 0}`);
      
      // Print first task and search query as sample
      if (plan.tasks?.length) console.log(`✅ Example Task: "${plan.tasks[0]}"`);
      if (plan.search_queries?.length) console.log(`✅ Example Query: "${plan.search_queries[0]}"`);
    }

    console.log(`\n✨ Planner Agent Phase 15 test COMPLETED! Check your database for agent_logs entry for session ${sessionId}.`);
  } catch (error) {
    console.error('❌ Planner test failed:', error);
    process.exit(1);
  }
}

testPlannerAgent();

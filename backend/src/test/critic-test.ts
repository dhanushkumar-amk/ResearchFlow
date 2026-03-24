import { runCriticAgent } from '../agents/critic';

async function testCritic() {
  console.log('🧐 Test Critic Agent (Agent 5) — Quality Reviewer\n');

  const query = 'Explain the impact of the Transformer architecture on NLP.';
  const plan = '1. Web search for history. 2. Verify attention mechanism in papers.';

  // ---- TEST 1: High Quality Report ----
  console.log('\n--- Test 1: High Quality Report (Expect: 8-10 Score and "Approve") ---');
  const highQualityReport = `
# Impact of Transformer on NLP
## Executive Summary
The Transformer architecture, introduced by Vaswani et al. (2017), revolutionized NLP by replacing RNNs and LSTMs with self-attention.
## Key Findings
- Self-attention allows parallelization.
- Models like BERT and GPT-3 were built on this foundation.
## Sources
- [https://arxiv.org/abs/1706.03762]
- attention_paper.pdf
  `.trim();

  const goodRes = await runCriticAgent({
    synthesizedReport: highQualityReport,
    originalQuery: query,
    researchPlan: plan
  });
  console.log('📡 Critic Result:', JSON.stringify(goodRes, null, 2));


  // ---- TEST 2: Bad Quality Report ----
  console.log('\n--- Test 2: Poor Quality Report (Expect: <7 Score and "Revise") ---');
  const badReport = `
The transformer is a robot from a movie. It can turn into a car. Transformers represent NLP because they change shape.
  `.trim();

  const badRes = await runCriticAgent({
    synthesizedReport: badReport,
    originalQuery: query,
    researchPlan: plan
  });
  console.log('📡 Critic Result:', JSON.stringify(badRes, null, 2));


  // ---- TEST 3: Max Retry Check ----
  console.log('\n--- Test 3: Iteration Lock (Attempt 3+) (Expect: "Approve" via safety guard) ---');
  const retryRes = await runCriticAgent({
    synthesizedReport: badReport,
    originalQuery: query,
    researchPlan: plan,
    attemptNumber: 3
  });
  console.log('📡 Critic Result:', JSON.stringify(retryRes, null, 2));


  console.log('\n🏁 Critic Agent Phase 21 test COMPLETE!');
}

testCritic();

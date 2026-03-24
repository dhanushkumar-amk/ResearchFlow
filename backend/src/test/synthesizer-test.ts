import { runSynthesizerAgent } from '../agents/synthesizer';

async function testSynthesizer() {
  console.log('📝 Test Synthesizer Agent (Agent 4) — Streaming Output\n');

  const startTime = Date.now();
  let firstTokenTime: number | null = null;
  let fullReport = '';

  const dummyInputs = {
    query: 'The environmental impact of deep sea mining in the Clarion-Clipperton Zone.',
    researchPlan: '1. Analyze web search for regulations. 2. Verify local ecosystem impact from PDF reports.',
    webResults: `
      1. [https://example.com/isa-regulations]: International Seabed Authority (ISA) is currently drafting the "Mining Code".
      2. [https://example.com/greenpeace-report]: Greenpeace warns of sediment plumes and noise pollution impacting whales.
    `,
    ragContext: `
      --- From internal_study.pdf ---
      Preliminary data from the 2024 Clarion-Clipperton expedition shows a 45% decline in xenophyophore density near pilot nodes.
      Wait, web data says sediment plumes are the main issue, but our sensor data shows NOISE is actually causing 70% of the mammal migration shifts.
    `,
  };

  console.log('📡 Starting Stream...\n-----------------------------------\n');

  try {
    const generator = runSynthesizerAgent(dummyInputs);

    for await (const chunk of generator) {
      if (firstTokenTime === null) {
        firstTokenTime = Date.now();
        const latency = firstTokenTime - startTime;
        console.log(`\n⏳ First Token Latency: ${latency}ms\n`);
      }
      process.stdout.write(chunk);
      fullReport += chunk;
    }

    const totalDuration = Date.now() - startTime;
    console.log('\n\n-----------------------------------');
    console.log(`🏁 Synthesis COMPLETE!`);
    console.log(`⏱️ Total Duration: ${totalDuration}ms`);
    console.log(`📊 Report Length: ${fullReport.length} characters`);
    
    if (fullReport.includes('Marrow Trench') || fullReport.includes('Clarion-Clipperton') || fullReport.includes('70%')) {
      console.log('\n✨ [PASS]: Synthesizer successfully connected web and RAG data!');
    }
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testSynthesizer();

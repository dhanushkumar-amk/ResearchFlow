const fs = require('fs');

async function test() {
  try {
    const mermaidModule = await import('mermaid');
    const mermaid = mermaidModule.default;
    mermaid.initialize({ startOnLoad: false });
    
    // This is the cleaned chart from fbd6bbfd-3cd3-4863-b49d-3dee92217623
    const cleanedChart = `graph TD
A[NLP Task] -->|Specific Task| B[Contextual Embedding Model]
B -->|Model Size| C[Small]
C -->|Dataset Size| D[Small Dataset]
D -->|Computational Resources| E[Low Resources]
E -->|Optimal Model| F[BERT]
B -->|Model Size| G[Large]
G -->|Dataset Size| H[Large Dataset]
H -->|Computational Resources| I[High Resources]
I -->|Optimal Model| J[RoBERTa]
B -->|Model Type| K[Domain-Specific]
K -->|Optimal Model| L[Domain-Specific Model]`;

    try {
      console.log("Parsing cleaned chart...");
      await mermaid.parse(cleanedChart);
      console.log("Parsing succeeded!");
      fs.writeFileSync('C:/Users/Star/.gemini/antigravity-ide/scratch/error-info.json', JSON.stringify({ status: "SUCCESS" }, null, 2));
    } catch (parseErr) {
      const info = {
        status: "FAILED_TO_PARSE",
        message: parseErr.message,
        name: parseErr.name,
        stack: parseErr.stack,
        stringRepresentation: String(parseErr),
      };
      fs.writeFileSync('C:/Users/Star/.gemini/antigravity-ide/scratch/error-info.json', JSON.stringify(info, null, 2));
      console.log("Parsing failed error written.");
    }
  } catch (err) {
    fs.writeFileSync('C:/Users/Star/.gemini/antigravity-ide/scratch/error-info.json', JSON.stringify({ loadError: err.message, stack: err.stack }, null, 2));
  }
}

test();

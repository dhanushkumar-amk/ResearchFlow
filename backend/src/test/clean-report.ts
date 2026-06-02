import { query } from '../db/postgres';
import dotenv from 'dotenv';
dotenv.config();

const cleanMermaidChart = (rawChart: string): string => {
  // Trim and remove any code block wrappers
  let cleaned = rawChart
    .replace(/^```mermaid\s*/i, '')
    .replace(/```$/, '')
    .trim();

  // Clean labeled arrow endings like `-->|Label|>` or `-->|Label| >` to `-->|Label|`
  cleaned = cleaned.replace(/\|([^|]*)\|\s*>/g, '|$1|');

  // Basic arrow and arrow-head corrections
  cleaned = cleaned
    .replace(/\|>/g, '-->') 
    .replace(/ -> /g, ' --> ') 
    .replace(/-- /g, '--> ');

  // Process line by line to fix node definitions with unquoted special characters
  const lines = cleaned.split('\n');
  const processedLines = lines.map(line => {
    let l = line.trim();
    if (!l) return l;

    // Preserving header / directive lines
    if (/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph)/i.test(l)) {
      return l;
    }

    // Replace raw ampersands with "and" inside labels to prevent syntax break
    l = l.replace(/&/g, 'and');

    // Fix unquoted node labels with special characters like parentheses
    // matches: NodeID[Label (with parens)] -> NodeID["Label (with parens)"]
    // Only apply to single node definitions, not connection lines
    const isConnection = l.includes('-->') || l.includes('==>') || l.includes('-.->') || l.includes('->');
    if (!isConnection) {
      const bracketRegex = /^([a-zA-Z0-9_-]+)\s*([\[\(\{]+)(.*?)([\]\)\}]+)$/;
      const match = l.match(bracketRegex);
      if (match) {
        const id = match[1];
        const openBracket = match[2];
        let label = match[3].trim();
        const closeBracket = match[4];

        if (!label.startsWith('"') || !label.endsWith('"')) {
          // Strip any existing wrapping quotes if unbalanced
          label = label.replace(/^"+|"+$/g, '').trim();
          return `${id}${openBracket}"${label}"${closeBracket}`;
        }
      }
    }

    return l;
  });

  let finalChart = processedLines.join('\n').trim();

  // Default to graph TD if no diagram type header is present
  if (!/^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram|gantt|pie|gitGraph)/i.test(finalChart)) {
    finalChart = 'graph TD\n' + finalChart;
  }

  return finalChart;
};

async function read() {
  const sessionId = 'fbd6bbfd-3cd3-4863-b49d-3dee92217623';
  try {
    const res = await query('SELECT content FROM reports WHERE session_id = $1', [sessionId]);
    if (res.rows.length === 0) {
      console.log('Report not found');
      return;
    }
    const content = res.rows[0].content;
    
    // Find all mermaid blocks
    const regex = /```mermaid([\s\S]*?)```/g;
    let match;
    let count = 0;
    while ((match = regex.exec(content)) !== null) {
      count++;
      console.log(`\n--- MERMAID BLOCK #${count} ---`);
      const raw = match[1];
      console.log("Raw:");
      console.log(raw);
      console.log("\nCleaned:");
      const cleaned = cleanMermaidChart(raw);
      console.log(cleaned);
      console.log('---------------------------');
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

read();

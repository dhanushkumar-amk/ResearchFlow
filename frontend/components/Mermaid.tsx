'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle } from 'lucide-react';

export interface MermaidProps {
  chart: string;
  isStreaming?: boolean;
}

/**
 * Extremely robust helper to clean up common LLM Mermaid syntax mistakes
 * without mangling valid connector labels.
 */
const cleanMermaidChart = (rawChart: string): string => {
  // Trim and remove any code block wrappers
  let cleaned = rawChart
    .replace(/^```mermaid\s*/i, '')
    .replace(/```$/, '')
    .trim();

  // Clean labeled arrow endings like `-->|Label|>` or `-->|Label| >` to `-->|Label|`
  cleaned = cleaned.replace(/\|([^|]*)\|\s*>/g, '|$1|');
  // Quote labels on edges too: A --> B[Retriever (vector search)].
  cleaned = cleaned.replace(/\b([A-Za-z_][\w-]*)\[([^\]\n]*)\]/g, (match, id, label) =>
    label.trim().startsWith('"') ? match : `${id}["${label.replace(/"/g, '&quot;')}"]`);

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
    // Preserve entities and quoted label contents.

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

type DiagramResult = { chart: string; svg: string } | { chart: string; error: true };

export default function Mermaid({ chart, isStreaming }: MermaidProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const revision = useRef(0);
  const [result, setResult] = useState<DiagramResult | null>(null);

  useEffect(() => {
    let active = true;
    const render = async () => {
      const source = chart.trim();
      if (!source) {
        if (active) setResult({ chart, error: true });
        return;
      }

      try {
        const mermaid = (await import('mermaid')).default;
        if (!active) return;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          securityLevel: 'strict',
          fontFamily: 'Inter, sans-serif',
          themeVariables: {
            primaryColor: '#eef2ff',
            primaryTextColor: '#151f3b',
            primaryBorderColor: '#8c9ed1',
            lineColor: '#536894',
            secondaryColor: '#f4f6fc',
            tertiaryColor: '#ffffff',
            edgeLabelBackground: '#ffffff',
          },
        });

        // Render valid source as written. Repairs are only attempted for a finished report.
        const valid = await mermaid.parse(source, { suppressErrors: true });
        if (!active) return;
        const diagram = valid || isStreaming ? source : cleanMermaidChart(source);
        if (!valid && isStreaming) return;
        let coloredDiagram = diagram;
        if (/^(graph|flowchart)\b/i.test(diagram) && !/\b(classDef|style)\s/.test(diagram)) {
          const nodes = [...diagram.matchAll(/\b([A-Za-z_][\w-]*)\s*[\[({]/g)].map(match => match[1]);
          const colors = ['#e0e7ff', '#ccfbf1', '#fef3c7', '#fce7f3', '#e0f2fe'];
          coloredDiagram += [...new Set(nodes)].map((node, index) =>
            `\nstyle ${node} fill:${colors[index % colors.length]},stroke:#64748b,color:#151f3b`).join('');
        }
        const { svg } = await mermaid.render(`mermaid-${id}-${++revision.current}`, coloredDiagram);
        if (active) setResult({ chart, svg });
      } catch {
        if (active && !isStreaming) setResult({ chart, error: true });
      }
    };

    const timer = window.setTimeout(render, isStreaming ? 400 : 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [chart, id, isStreaming]);

  const current = result?.chart === chart ? result : null;

  if (current && 'svg' in current) {
    return (
      <div className="rf-diagram not-prose">
        <div className="rf-diagram-content" dangerouslySetInnerHTML={{ __html: current.svg }} />
      </div>
    );
  }

  const failed = current && 'error' in current;
  return (
    <div className="rf-diagram not-prose text-sm text-ui-muted">
      <p role="status" className="flex items-center gap-2">
        {failed && <AlertCircle size={17} className="text-brand" aria-hidden="true" />}
        {failed ? 'This diagram could not be displayed.' : isStreaming ? 'Waiting for the diagram text…' : 'Rendering diagram…'}
      </p>
      <details className="mt-2">
        <summary className="cursor-pointer text-brand">View diagram source</summary>
        <pre className="mt-2 overflow-x-auto text-xs">{chart}</pre>
      </details>
    </div>
  );
}

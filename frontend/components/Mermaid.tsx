'use client';

import React, { useEffect, useRef, useState } from 'react';
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

/**
 * High-Density Mermaid Renderer
 * Uses dynamic import on client-side to prevent Node SSR failures and 
 * provides a beautiful fail-safe UI in case of syntax rendering issues.
 */
export default function Mermaid({ chart, isStreaming }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const renderChart = async () => {
      if (isStreaming) return;
      if (!chart || chart.trim() === '') return;
      
      try {
        // Dynamic client-only import to resolve document/window SSR issues
        const mermaid = (await import('mermaid')).default;
        
        mermaid.initialize({
          startOnLoad: false,
          theme: 'base',
          securityLevel: 'loose',
          fontFamily: 'Inter, sans-serif',
          themeVariables: {
            primaryColor: '#f8fafc',
            primaryTextColor: '#0f172a',
            primaryBorderColor: '#cbd5e1',
            lineColor: '#64748b',
            secondaryColor: '#f1f5f9',
            tertiaryColor: '#ffffff',
            edgeLabelBackground: '#ffffff',
          },
        });

        // Clean the chart syntax
        const cleanedChart = cleanMermaidChart(chart);

        // Pre-validate syntax before rendering
        try {
          await mermaid.parse(cleanedChart);
        } catch (parseErr: any) {
          throw new Error(`Syntax check failed: ${parseErr.message}`);
        }

        // Unique ID for each render to avoid collisions
        const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
        
        const { svg: generatedSvg } = await mermaid.render(id, cleanedChart);
        
        if (isMounted) {
          setSvg(generatedSvg);
          setError(null);
        }
      } catch (err: any) {
        console.error('❌ [Mermaid Render Error]:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    };

    renderChart();
    return () => { isMounted = false; };
  }, [chart, isStreaming]);

  if (isStreaming) {
    return (
      <div className="my-6 p-6 bg-slate-50/50 rounded-2xl border border-dashed border-emerald-200 text-center animate-pulse">
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
           Visualizing Strategic Map...
        </span>
      </div>
    );
  }

  if (error && !svg) {
    return (
      <div className="my-6 p-5 bg-rose-50/50 rounded-2xl border border-rose-100 text-left space-y-3 animate-in fade-in duration-200">
        <div className="flex items-center gap-2 text-rose-800 text-[10px] font-black uppercase tracking-wider">
          <AlertCircle className="w-4 h-4 text-rose-500" />
          <span>Diagram Render Warning</span>
        </div>
        <p className="text-xs text-rose-600 font-semibold leading-relaxed">
          The generated report map contains formatting syntax issues: <code className="bg-white/80 px-1 py-0.5 rounded text-[10px] font-mono border border-rose-100">{error.slice(0, 100)}</code>
        </p>
        <details className="text-[9px] text-slate-400 font-medium">
          <summary className="cursor-pointer hover:text-slate-655 uppercase tracking-widest font-black">View Raw Diagram Code</summary>
          <pre className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl overflow-x-auto font-mono text-[10px] text-slate-700 leading-normal">
            {chart}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="my-6 overflow-x-auto bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-xs flex justify-center animate-in fade-in duration-300">
      <div 
        ref={containerRef} 
        className="mermaid-container w-full max-w-full flex justify-center text-slate-800"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}

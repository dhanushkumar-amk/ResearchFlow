'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid with optimal settings
mermaid.initialize({
  startOnLoad: false, // Changed to false for manual rendering
  theme: 'base',
  securityLevel: 'loose',
  fontFamily: 'Geist Sans, Inter, sans-serif',
  themeVariables: {
    primaryColor: '#eff6ff',
    primaryTextColor: '#1e40af',
    primaryBorderColor: '#3b82f6',
    lineColor: '#60a5fa',
    secondaryColor: '#f1f5f9',
    tertiaryColor: '#ffffff',
    edgeLabelBackground: '#ffffff',
  },
});

export interface MermaidProps {
  chart: string;
  isStreaming?: boolean;
}

/**
 * Extremely robust helper to clean up common LLM Mermaid syntax mistakes.
 */
const cleanMermaidChart = (rawChart: string): string => {
  // 1. Basic character and arrow corrections
  let cleaned = rawChart
    .replace(/\|>/g, '-->') 
    .replace(/ -> /g, ' --> ') 
    .replace(/-- /g, '--> ') 
    .replace(/&/g, 'and');

  // 2. Process line by line to correct structural errors
  const lines = cleaned.split('\n');
  const processedLines = lines.map(line => {
    let l = line.trim();
    if (!l) return l;

    // Directives should be preserved
    if (l.startsWith('graph ') || l.startsWith('flowchart ') || l.startsWith('sequenceDiagram') || l.startsWith('classDiagram')) {
      return l;
    }

    // Fix connection spaces: "Query Web --> Synthesize Report" => "Query_Web["Query Web"] --> Synthesize_Report["Synthesize Report"]"
    if (l.includes('-->') && !l.includes('[') && !l.includes('(') && !l.includes('{') && !l.includes('"')) {
      const parts = l.split('-->');
      const cleanParts = parts.map(part => {
        const p = part.trim();
        if (!p) return p;
        const id = p.replace(/[^a-zA-Z0-9]/g, '_');
        return `${id}["${p}"]`;
      });
      return cleanParts.join(' --> ');
    }

    // Wrap unquoted labels with parentheses or brackets in double quotes: ID[Label (Special)] => ID["Label (Special)"]
    const bracketRegex = /^([a-zA-Z0-9_-]+)\s*([\[\(\{]+)(.*?)([\]\)\}]+)$/;
    const match = l.match(bracketRegex);
    if (match) {
      const id = match[1];
      const openBracket = match[2];
      let label = match[3].trim();
      const closeBracket = match[4];

      if (!label.startsWith('"') || !label.endsWith('"')) {
        label = label.replace(/^"+|"+$/g, '').trim();
        return `${id}${openBracket}"${label}"${closeBracket}`;
      }
    }

    return l;
  });

  return processedLines.join('\n');
};

/**
 * High-Density Mermaid Renderer
 * Uses explicit rendering and a robust parser to prevent 'Syntax error in text'.
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
        // Clean the chart syntax
        const cleanedChart = cleanMermaidChart(chart);

        // Pre-validate syntax to prevent library error visual dumps
        try {
          await mermaid.parse(cleanedChart);
        } catch (parseErr: any) {
          throw new Error(`Syntax validation failed: ${parseErr.message}`);
        }

        // Unique ID for each render to avoid collisions
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        const { svg: generatedSvg } = await mermaid.render(id, cleanedChart);
        
        if (isMounted) {
          setSvg(generatedSvg);
          setError(null);
        }
      } catch (err: any) {
        console.warn('❌ [Mermaid Render Warning]:', err.message);
        if (isMounted) {
          setError('Formatting Intelligence...');
        }
      }
    };

    renderChart();
    return () => { isMounted = false; };
  }, [chart, isStreaming]);

  if (isStreaming) {
    return (
      <div className="my-6 p-6 bg-zinc-50 rounded-2xl border border-dashed border-emerald-200 text-center">
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest animate-pulse">
           Visualizing Strategic Map...
        </span>
      </div>
    );
  }

  if (error && !svg) {
    return (
      <div className="my-6 p-6 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 text-center">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest animate-pulse">
           Visualizing Strategic Map...
        </span>
      </div>
    );
  }

  return (
    <div className="my-6 overflow-x-auto bg-zinc-50 rounded-2xl p-6 border border-zinc-100 shadow-inner flex justify-center">
      <div 
        ref={containerRef} 
        className="mermaid-container w-full max-w-full flex justify-center"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}

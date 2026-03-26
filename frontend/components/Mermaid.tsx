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
}

/**
 * High-Density Mermaid Renderer
 * Uses explicit rendering to prevent 'Syntax error in text' when streaming.
 */
export default function Mermaid({ chart }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      if (!chart || chart.trim() === '') return;
      
      try {
        // AUTO-CORRECT: Link LLM hallucinations back to valid Mermaid syntax
        const cleanedChart = chart
          .replace(/\|>/g, '-->') // Common mistake
          .replace(/ -> /g, ' --> ') // Compatibility
          .replace(/-- /g, '--> ') // Missing arrow head
          .replace(/&/g, 'and'); // Escape ampersands which break some parsers

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
  }, [chart]);

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

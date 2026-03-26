'use client';

import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: true,
  theme: 'base',
  fontFamily: 'Geist Sans, Inter, system-ui',
  fontSize: 14,
  themeVariables: {
    primaryColor: '#eff6ff',
    primaryTextColor: '#1e40af',
    primaryBorderColor: '#3b82f6',
    lineColor: '#60a5fa',
    secondaryColor: '#f1f5f9',
    tertiaryColor: '#ffffff',
  },
});

export interface MermaidProps {
  chart: string;
}

export default function Mermaid({ chart }: MermaidProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && chart) {
      try {
        containerRef.current.removeAttribute('data-processed');
        mermaid.contentLoaded();
      } catch (err) {
        console.error('Mermaid render error:', err);
      }
    }
  }, [chart]);

  return (
    <div className="my-6 overflow-x-auto bg-zinc-50 rounded-2xl p-6 border border-zinc-100 shadow-inner flex justify-center">
      <div 
        ref={containerRef} 
        className="mermaid"
      >
        {chart}
      </div>
    </div>
  );
}

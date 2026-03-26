'use client';

import React, { useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { ResearchSources } from '../types/research';
import { Share2 } from 'lucide-react';

interface NeuralMapProps {
  sources: ResearchSources | null;
  query: string;
}

interface Node {
  id: string;
  name: string;
  val: number;
  type: 'query' | 'web' | 'rag' | 'plan' | 'finding';
  color: string;
}

interface Link {
  source: string;
  target: string;
}

export default function NeuralMap({ sources, query }: NeuralMapProps) {
  // Use fixed size for better performance and consistency
  const width = 400;
  const height = 400;

  const data = useMemo(() => {
    // 1. Central Query
    const nodes: Node[] = [
      { id: 'query', name: query.substring(0, 30) + '...', val: 15, type: 'query', color: '#2563eb' }
    ];
    const links: Link[] = [];

    // 2. Base Agent Nodes (always there to show structure)
    nodes.push({ id: 'planner', name: 'Strategic Planner', val: 8, type: 'plan', color: '#9333ea' });
    links.push({ source: 'query', target: 'planner' });

    if (sources) {
      // 3. Web Cluster
      if (sources.webCount > 0) {
        nodes.push({ id: 'web_hub', name: 'Global Web Index', val: 10, type: 'web', color: '#f59e0b' });
        links.push({ source: 'query', target: 'web_hub' });
        
        for (let i = 0; i < sources.webCount; i++) {
          const id = `web_${i}`;
          nodes.push({ id, name: `Source ${i+1}`, val: 4, type: 'web', color: '#fbbf24' });
          links.push({ source: 'web_hub', target: id });
        }
      }

      // 4. Document/RAG Cluster
      if (sources.ragCount > 0) {
        nodes.push({ id: 'rag_hub', name: 'Private Vault', val: 10, type: 'rag', color: '#10b981' });
        links.push({ source: 'query', target: 'rag_hub' });
        
        for (let i = 0; i < 5; i++) { // Generate meaningful small nodes for context
          const id = `chunk_${i}`;
          nodes.push({ id, name: `Context Piece ${i+1}`, val: 3, type: 'rag', color: '#6ee7b7' });
          links.push({ source: 'rag_hub', target: id });
        }
      }

      // 5. Findings Cluster (Simulated for visualization)
      nodes.push({ id: 'findings_hub', name: 'Key Discoveries', val: 12, type: 'finding', color: '#ef4444' });
      links.push({ source: 'query', target: 'findings_hub' });
      for (let i = 0; i < 3; i++) {
        const id = `finding_${i}`;
        nodes.push({ id, name: `Result ${i+1}`, val: 6, type: 'finding', color: '#fca5a5' });
        links.push({ source: 'findings_hub', target: id });
      }
    }

    return { nodes, links };
  }, [sources, query]);

  return (
    <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-sm flex flex-col h-100">
      <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 shrink-0">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-zinc-400" />
          <h2 className="font-bold text-zinc-800 text-xs uppercase tracking-widest">Neural Knowledge Map</h2>
        </div>
        {!sources && (
          <span className="flex items-center gap-1.5 text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-black uppercase animate-pulse">
             Wiring Agents...
          </span>
        )}
      </div>

      <div className="flex-1 relative bg-zinc-50/30">
        <ForceGraph2D
          graphData={data}
          width={width}
          height={height - 70}
          nodeLabel="name"
          nodeColor={(node: any) => node.color}
          linkColor={() => '#cbd5e1'}
          linkWidth={1}
          linkDirectionalParticles={1}
          linkDirectionalParticleSpeed={0.005}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.name;
            const fontSize = node.type === 'query' ? 14 / globalScale : 11 / globalScale;
            ctx.font = `${fontSize}px Inter, sans-serif`;
            
            // Draw circle
            ctx.fillStyle = node.color;
            ctx.shadowBlur = 10 / globalScale;
            ctx.shadowColor = node.color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Optional: Draw text labels for important nodes
            if (globalScale > 2 || node.type === 'query' || node.val > 8) {
              const textWidth = ctx.measureText(label).width;
              ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.fillRect(node.x - textWidth / 2 - 2, node.y - 12 - fontSize, textWidth + 4, fontSize + 4);
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#0f172a';
              ctx.fillText(label, node.x, node.y - 15);
            }
          }}
        />
      </div>

      {/* Modern Legend */}
      <div className="px-5 py-3 border-t border-zinc-100 bg-white flex justify-between gap-2 shrink-0 overflow-x-auto no-scrollbar">
         {[
           { color: 'bg-blue-600', label: 'Query' },
           { color: 'bg-amber-500', label: 'Web' },
           { color: 'bg-emerald-500', label: 'Docs' },
           { color: 'bg-red-500', label: 'Found' }
         ].map(item => (
           <div key={item.label} className="flex items-center gap-1.5 whitespace-nowrap">
              <div className={`w-1.5 h-1.5 rounded-full ${item.color}`} />
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">{item.label}</span>
           </div>
         ))}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import AgentTimeline from '../../components/AgentTimeline';

export default function TestTimeline() {
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const nodes = ['planner', 'researcher', 'rag', 'synthesizer', 'critic'];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-12">
      <div className="max-w-2xl mx-auto space-y-12 bg-white dark:bg-zinc-900 p-12 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl animate-in zoom-in-95 duration-500">
        <header className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Timeline Test Bench</h1>
          <p className="text-zinc-500">Test different agent states to ensure smooth transitions</p>
        </header>

        <div className="flex flex-wrap items-center justify-center gap-4 border-y border-zinc-100 dark:border-zinc-800 py-8">
          {nodes.map(node => (
            <button
              key={node}
              onClick={() => {
                setActiveNode(node);
                setIsComplete(false);
              }}
              className={`px-6 py-2 rounded-xl font-bold transition-all active:scale-95 ${
                activeNode === node 
                  ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-600/20' 
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
              }`}
            >
              {node}
            </button>
          ))}
          <button
            onClick={() => {
              setActiveNode(null);
              setIsComplete(true);
            }}
            className={`px-6 py-2 rounded-xl font-bold transition-all active:scale-95 ${
              isComplete 
                ? 'bg-green-600 text-white shadow-lg ring-4 ring-green-600/20' 
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
            }`}
          >
            Complete
          </button>
          <button
            onClick={() => {
              setActiveNode(null);
              setIsComplete(false);
            }}
            className="px-6 py-2 rounded-xl font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-80 transition-all active:scale-95"
          >
            Reset
          </button>
        </div>

        <AgentTimeline activeNode={activeNode} isComplete={isComplete} />
      </div>
    </div>
  );
}

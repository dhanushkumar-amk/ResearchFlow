import React, { useEffect, useReducer } from 'react';
import { CheckCircle2, Loader2, LucideIcon, Brain, Search, Database, PenTool, Star } from 'lucide-react';

export type AgentState = 'waiting' | 'running' | 'complete';

interface Agent {
  id: string;
  name: string;
  icon: LucideIcon;
  description: string;
}

const AGENTS: Agent[] = [
  { id: 'planner', name: 'Planner', icon: Brain, description: 'Structuring the research strategy' },
  { id: 'researcher', name: 'Search', icon: Search, description: 'Gathering relevant information from the web' },
  { id: 'rag', name: 'RAG', icon: Database, description: 'Querying internal document context' },
  { id: 'synthesizer', name: 'Synthesizer', icon: PenTool, description: 'Crafting the final evidence-based report' },
  { id: 'critic', name: 'Critic', icon: Star, description: 'Evaluating content for quality and accuracy' },
];

interface StateItem {
  state: AgentState;
  startTime?: number;
  duration?: number;
}

type State = Record<string, StateItem>;

type Action = 
  | { type: 'START_NODE'; node: string }
  | { type: 'COMPLETE_ALL' }
  | { type: 'RESET' };

function reducer(state: State, action: Action): State {
  const now = Date.now();
  
  switch (action.type) {
    case 'START_NODE': {
      const next = { ...state };
      
      // Complete currently running node
      const runningId = Object.keys(next).find(id => next[id].state === 'running');
      if (runningId && runningId !== action.node) {
        const start = next[runningId].startTime || now;
        next[runningId] = { state: 'complete', duration: now - start };
      }

      // Start new node
      if (!next[action.node] || next[action.node].state !== 'complete') {
        next[action.node] = { state: 'running', startTime: now };
      }
      return next;
    }
    case 'COMPLETE_ALL': {
      const next = { ...state };
      Object.keys(next).forEach(id => {
        if (next[id].state === 'running') {
          const start = next[id].startTime || now;
          next[id] = { state: 'complete', duration: now - start };
        }
      });
      return next;
    }
    case 'RESET': {
      const initial: State = {};
      AGENTS.forEach(a => initial[a.id] = { state: 'waiting' });
      return initial;
    }
    default:
      return state;
  }
}

interface AgentTimelineProps {
  activeNode?: string | null;
  isComplete?: boolean;
}

const AgentTimeline: React.FC<AgentTimelineProps> = ({ activeNode, isComplete }) => {
  const [agentStatuses, dispatch] = useReducer(reducer, {}, () => {
    const initial: State = {};
    AGENTS.forEach(a => initial[a.id] = { state: 'waiting' });
    return initial;
  });

  useEffect(() => {
    if (isComplete) {
      dispatch({ type: 'COMPLETE_ALL' });
    } else if (activeNode) {
      dispatch({ type: 'START_NODE', node: activeNode });
    } else {
      dispatch({ type: 'RESET' });
    }
  }, [activeNode, isComplete]);

  return (
    <div className="w-full max-w-lg mx-auto py-8">
      <div className="relative space-y-8">
        <div className="absolute left-6.75 top-2 bottom-2 w-0.5 bg-zinc-200 dark:bg-zinc-800 -z-10" />

        {AGENTS.map((agent) => {
          const status = agentStatuses[agent.id] || { state: 'waiting' };
          const Icon = agent.icon;

          return (
            <div 
              key={agent.id} 
              className={`flex items-start gap-6 transition-all duration-300 ${status.state === 'waiting' ? 'opacity-40 grayscale' : 'opacity-100 grayscale-0'}`}
            >
              <div className="relative shrink-0 mt-1">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm border-2 ${
                  status.state === 'complete' ? 'bg-green-500 border-green-500 text-white' : 
                  status.state === 'running' ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-500/20' : 
                  'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400'
                }`}>
                  <Icon className={`w-7 h-7 ${status.state === 'running' ? 'animate-pulse' : ''}`} />
                  <div className="absolute -bottom-1 -right-1">
                    {status.state === 'complete' && (
                      <div className="bg-white dark:bg-green-500 rounded-full text-green-500 dark:text-white ring-2 ring-white">
                        <CheckCircle2 className="w-5 h-5 fill-current" />
                      </div>
                    )}
                    {status.state === 'running' && (
                      <div className="bg-white dark:bg-blue-600 rounded-full text-blue-600 dark:text-white p-0.5 ring-2 ring-white">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className={`font-bold transition-colors ${
                    status.state === 'complete' ? 'text-green-600 dark:text-green-400' : 
                    status.state === 'running' ? 'text-blue-600 dark:text-blue-400' : 
                    'text-zinc-500 dark:text-zinc-400'
                  }`}>
                    {agent.name}
                  </h3>
                  {status.duration && (
                    <span className="text-xs font-mono text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                      {status.duration}ms
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-400 dark:text-zinc-500">
                  {agent.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentTimeline;

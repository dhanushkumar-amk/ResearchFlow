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
    <div className="w-full max-w-lg mx-auto py-4">
      <div className="relative space-y-6">
        <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-zinc-200 -z-10" />

        {AGENTS.map((agent) => {
          const status = agentStatuses[agent.id] || { state: 'waiting' };
          const Icon = agent.icon;

          return (
            <div
              key={agent.id}
              className={`flex items-start gap-4 transition-all duration-300 ${status.state === 'waiting' ? 'opacity-40' : 'opacity-100'}`}
            >
              <div className="relative shrink-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 border-2 ${
                  status.state === 'complete' ? 'bg-green-500 border-green-500 text-white' :
                  status.state === 'running' ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100' :
                  'bg-white border-zinc-200 text-zinc-400'
                }`}>
                  <Icon className={`w-5 h-5 ${status.state === 'running' ? 'animate-pulse' : ''}`} />
                </div>
                {status.state === 'complete' && (
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full text-green-500 ring-1 ring-white">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {status.state === 'running' && (
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full text-blue-500 ring-1 ring-white">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-semibold ${
                    status.state === 'complete' ? 'text-green-600' :
                    status.state === 'running' ? 'text-blue-600' :
                    'text-zinc-500'
                  }`}>
                    {agent.name}
                  </h3>
                  {status.duration && (
                    <span className="text-xs font-mono text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">
                      {status.duration}ms
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400">{agent.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentTimeline;

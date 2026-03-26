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

/**
 * PARALLEL-AWARE REDUCER
 * Allows multiple nodes to be in 'running' state simultaneously (e.g., Search + RAG).
 */
function reducer(state: State, action: Action): State {
  const now = Date.now();
  
  switch (action.type) {
    case 'START_NODE': {
      const next = { ...state };
      const nodeId = action.node;

      // Special rule: if synthesizer starts, finish all previous nodes
      if (nodeId === 'synthesizer') {
        ['planner', 'researcher', 'rag'].forEach(id => {
          if (next[id] && next[id].state !== 'complete') {
            const start = next[id].startTime || (now - 1000);
            next[id] = { state: 'complete', duration: now - start };
          }
        });
      }

      // If researcher/rag starts, finish planner
      if (nodeId === 'researcher' || nodeId === 'rag') {
        if (next['planner'] && next['planner'].state !== 'complete') {
          const start = next['planner'].startTime || (now - 1000);
          next['planner'] = { state: 'complete', duration: now - start };
        }
      }

      // Mark the target node as running
      if (!next[nodeId] || next[nodeId].state !== 'complete') {
        next[nodeId] = { state: 'running', startTime: now };
      }
      return next;
    }
    case 'COMPLETE_ALL': {
      const next = { ...state };
      AGENTS.forEach(agent => {
        if (next[agent.id].state !== 'complete') {
          const start = next[agent.id].startTime || (now - 2000);
          next[agent.id] = { state: 'complete', duration: Math.max(100, now - start) };
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
    }
  }, [activeNode, isComplete]);

  return (
    <div className="w-full max-w-lg mx-auto py-2">
      <div className="relative space-y-5">
        <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-zinc-100 -z-10" />

        {AGENTS.map((agent) => {
          const status = agentStatuses[agent.id] || { state: 'waiting' };
          const Icon = agent.icon;

          return (
            <div
              key={agent.id}
              className={`flex items-start gap-4 transition-all duration-300 ${status.state === 'waiting' ? 'opacity-30' : 'opacity-100'}`}
            >
              <div className="relative shrink-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 border-2 ${
                  status.state === 'complete' ? 'bg-green-500 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]' :
                  status.state === 'running' ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-50' :
                  'bg-white border-zinc-100 text-zinc-300'
                }`}>
                  <Icon className={`w-5 h-5 ${status.state === 'running' ? 'animate-pulse' : ''}`} />
                </div>
                {status.state === 'complete' && (
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full text-green-500 ring-2 ring-white">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {status.state === 'running' && (
                  <div className="absolute -bottom-1 -right-1 bg-white rounded-full text-blue-500 ring-2 ring-white">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between group">
                  <h3 className={`text-[13px] font-bold tracking-tight transition-colors ${
                    status.state === 'complete' ? 'text-green-600' :
                    status.state === 'running' ? 'text-blue-600' :
                    'text-zinc-400'
                  }`}>
                    {agent.name}
                  </h3>
                  {status.duration && (
                    <span className="text-[10px] font-black font-mono text-zinc-300 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-100">
                      {status.duration}ms
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">{agent.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgentTimeline;

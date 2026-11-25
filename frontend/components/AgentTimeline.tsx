import React, { useEffect, useReducer } from 'react';
import { CheckCircle2, Loader2, LucideIcon, Brain, Search, Database, PenTool, Star } from 'lucide-react';

export type AgentState = 'waiting' | 'running' | 'complete';

interface Agent {
  id: string;
  name: string;
  icon: LucideIcon;
}

const AGENTS: Agent[] = [
  { id: 'planner', name: 'Plan', icon: Brain },
  { id: 'researcher', name: 'Web search', icon: Search },
  { id: 'rag', name: 'Library search', icon: Database },
  { id: 'synthesizer', name: 'Draft', icon: PenTool },
  { id: 'critic', name: 'Review', icon: Star },
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
            const start = next[id].startTime;
            next[id] = { state: 'complete', duration: start ? now - start : undefined };
          }
        });
      }

      // If researcher/rag starts, finish planner
      if (nodeId === 'researcher' || nodeId === 'rag') {
        if (next['planner'] && next['planner'].state !== 'complete') {
          const start = next['planner'].startTime;
          next['planner'] = { state: 'complete', duration: start ? now - start : undefined };
        }
      }

      if (nodeId === 'critic' && next.synthesizer?.state === 'running') {
        const start = next.synthesizer.startTime;
        next.synthesizer = { state: 'complete', duration: start ? now - start : undefined };
      }

      // Mark the target node as running
      if (next[nodeId]?.state !== 'running') {
        next[nodeId] = { state: 'running', startTime: now };
      }
      return next;
    }
    case 'COMPLETE_ALL': {
      const next = { ...state };
      AGENTS.forEach(agent => {
        if (next[agent.id].state !== 'complete') {
          const start = next[agent.id].startTime;
          next[agent.id] = { state: 'complete', duration: start ? now - start : undefined };
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
    <ol className="divide-y divide-zinc-100">
      {AGENTS.map(agent => {
        const status = agentStatuses[agent.id];
        const Icon = status.state === 'complete' ? CheckCircle2 : status.state === 'running' ? Loader2 : agent.icon;
        return (
          <li key={agent.id} className="flex items-center gap-2.5 py-2.5 text-sm">
            <Icon size={16} className={status.state === 'complete' ? 'text-green-700' : status.state === 'running' ? 'text-indigo-700 motion-safe:animate-spin' : 'text-zinc-600'} aria-hidden="true" />
            <span className="flex-1 font-medium">{agent.name}</span>
            <span className="text-xs text-zinc-600">{status.state === 'complete' ? status.duration ? `${(status.duration / 1000).toFixed(1)} s` : 'Done' : status.state === 'running' ? 'Running' : 'Waiting'}</span>
          </li>
        );
      })}
    </ol>
  );
};

export default AgentTimeline;

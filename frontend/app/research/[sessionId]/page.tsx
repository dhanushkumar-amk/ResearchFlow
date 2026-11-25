'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, RotateCcw, CheckCircle2, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

import AgentTimeline from '../../../components/AgentTimeline';
import StreamingReport from '../../../components/StreamingReport';
import ResearchChat from '../../../components/ResearchChat';
import { API_URL, getResearchStream } from '../../../lib/api';
import { ResearchEvent, ResearchStatus, ResearchComplete, ResearchToken, ResearchPlan, ResearchSources } from '../../../types/research';
import { useAuth } from '../../../lib/AuthContext';

export default function ResearchPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const { token } = useAuth();

  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [reportText, setReportText] = useState('');
  const [plan, setPlan] = useState<string | null>(null);
  const [sources, setSources] = useState<ResearchSources | null>(null);
  const [statusMessage, setStatusMessage] = useState('Connecting to research agents...');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isError, setIsError] = useState(false);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // Follow-up interaction states
  const [chatTrigger, setChatTrigger] = useState<{ text: string; timestamp: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionCoords, setSelectionCoords] = useState<{ top: number; left: number } | null>(null);

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection) return;
    const text = selection.toString().trim();
    if (text && text.length > 5 && text.length < 300) {
      try {
        const range = selection.getRangeAt(0);
        const container = document.getElementById('report-content-body');
        if (container && container.contains(range.commonAncestorContainer)) {
          const rect = range.getBoundingClientRect();
          const top = Math.max(8, rect.top - 45);
          const left = Math.max(70, Math.min(window.innerWidth - 70, rect.left + rect.width / 2));
          setSelectedText(text);
          setSelectionCoords({ top, left });
          return;
        }
      } catch {
        // Selection range empty or transient error
      }
    }
    setSelectedText('');
    setSelectionCoords(null);
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleSelection);
    return () => {
      document.removeEventListener('mouseup', handleSelection);
    };
  }, [handleSelection]);

  const eventSourceRef = useRef<EventSource | null>(null);

  const handleTogglePublic = async (val: boolean) => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/api/research/${sessionId}/public`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPublic: val })
      });
      if (response.ok) {
        setIsPublic(val);
      }
    } catch (err) {
      console.error('Failed to toggle public status:', err);
    }
  };

  const connectToStream = useCallback(() => {
    if (!sessionId || !token) return;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = getResearchStream(sessionId, token, (event: ResearchEvent) => {
      switch (event.type) {
        case 'connected':
          setIsError(false);
          setIsComplete(false);
          setIsStreaming(false);
          setReportText('');
          setStatusMessage('Preparing the report…');
          setActiveNode(null);
          break;
        case 'status': {
          const d = event.data as ResearchStatus;
          setActiveNode(d.node);
          setStatusMessage(({ planner: 'Planning the research…', researcher: 'Searching the web…', rag: 'Checking your library…', synthesizer: 'Drafting the report…', critic: 'Reviewing the draft…' } as Record<string, string>)[d.node] ?? d.message);
          if (d.node === 'synthesizer') setIsStreaming(true);
          break;
        }
        case 'plan':
          setPlan((event.data as ResearchPlan).plan);
          break;
        case 'sources':
          setSources(event.data as ResearchSources);
          break;
        case 'report_reset':
          setReportText('');
          break;
        case 'report':
        case 'token': {
          const text = typeof event.data === 'string' ? event.data : (event.data as ResearchToken).text;
          setReportText((prev) => prev + text);
          setIsStreaming(true);
          setActiveNode(current => current ?? 'synthesizer');
          setStatusMessage('Drafting the report…');
          break;
        }
        case 'complete': {
          const d = event.data as ResearchComplete;
          setIsStreaming(false);
          setIsComplete(true);
          setQualityScore(d.score ?? null);
          setDurationSeconds(d.duration_seconds ?? null);
          setIsPublic(d.is_public ?? false);
          setStatusMessage('Research complete');
          if (d.report) setReportText(d.report);
          es.close();
          break;
        }
        case 'error': {
          const rawData = event.data;
          let message = 'An error occurred during research.';

          if (typeof rawData === 'string') {
            message = rawData;
          } else if (rawData && typeof rawData === 'object' && 'message' in rawData) {
            message = rawData.message;
          }

          setIsError(true);
          setErrorMessage(message);
          setIsStreaming(false);
          es.close();
          break;
        }
      }
    });

    es.onerror = (event) => {
      if (event instanceof MessageEvent) return;
      setIsError(true);
      setErrorMessage('Could not connect to the research stream.');
      setIsStreaming(false);
      es.close();
    };

    eventSourceRef.current = es;
  }, [sessionId, token]);

  useEffect(() => {
    connectToStream();
    return () => eventSourceRef.current?.close();
  }, [connectToStream]);

  const askAbout = (text: string) => {
    setChatTrigger({ text, timestamp: Date.now() });
    setSelectedText('');
    setSelectionCoords(null);
    window.getSelection()?.removeAllRanges();
    document.getElementById('interactive-chat-widget')?.scrollIntoView({ block: 'nearest' });
  };

  return (
    <main className="rf-session">
      <header className="rf-session-head">
        <Link href="/history" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 hover:underline">
          <ArrowLeft size={16} aria-hidden="true" /> Research history
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-700" role="status">
          {isError ? <AlertCircle size={16} className="text-red-700" /> : isComplete ? <CheckCircle2 size={16} className="text-green-700" /> : <span className="size-2 rounded-full bg-indigo-600" />}
          {isError ? errorMessage : statusMessage}
          {isError && <button type="button" className="rf-report-control" onClick={connectToStream}><RotateCcw size={14} /> Reconnect</button>}
        </div>
      </header>

      <div className="rf-session-grid">
        <div className="min-w-0">
          <StreamingReport content={reportText} isStreaming={isStreaming} qualityScore={qualityScore} durationSeconds={durationSeconds} sessionId={sessionId} isPublic={isPublic} onTogglePublic={handleTogglePublic} />
          {selectionCoords && isComplete && (
            <button type="button" className="rf-selection" style={selectionCoords} onMouseDown={event => event.preventDefault()} onClick={() => askAbout(`Can you explain this part of the report? “${selectedText}”`)}>
              Ask about this
            </button>
          )}
        </div>
        <aside className="min-w-0 space-y-4" aria-label="Research details">
          {!isComplete && (
            <section className="rf-panel">
              <h2 className="mb-3 text-sm font-semibold">Research progress</h2>
              <AgentTimeline activeNode={activeNode} isComplete={isComplete} />
            </section>
          )}
          {plan && (
            <details className="rf-panel">
              <summary className="cursor-pointer text-sm font-semibold">Research plan</summary>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-700">{plan}</p>
            </details>
          )}
          {sources && (
            <p className="text-sm text-zinc-600">{sources.webCount} web sources · {sources.ragCount} library matches</p>
          )}
          {isComplete && (
            <div id="interactive-chat-widget" className="space-y-3">
              <ResearchChat sessionId={sessionId} externalTrigger={chatTrigger} />
              <div className="flex flex-wrap gap-2" aria-label="Suggested follow-up questions">
                {['Where do the sources disagree?', 'What are the main limitations?', 'What should I look into next?', 'How were the findings reached?'].map(question => (
                  <button type="button" key={question} className="rf-report-control" onClick={() => askAbout(question)}>{question}</button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

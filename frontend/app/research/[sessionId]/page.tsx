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
import { API_URL, getResearchProgress, getResearchStream } from '../../../lib/api';
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

  const stopConnection = useRef<(() => void) | null>(null);

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
    stopConnection.current?.();
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let connectionTimer: ReturnType<typeof setTimeout> | undefined;
    let stream: EventSource | undefined;
    let fallback = false;
    let failures = 0;
    let checking = false;

    const stop = () => {
      controller.abort();
      clearTimeout(timer);
      clearTimeout(connectionTimer);
      stream?.close();
    };
    stopConnection.current = stop;

    const showError = (message: string) => {
      stop();
      setIsError(true);
      setErrorMessage(message);
      setIsStreaming(false);
    };

    const complete = (report: ResearchComplete) => {
      stop();
      setIsError(false);
      setIsStreaming(false);
      setIsComplete(true);
      setQualityScore(report.score ?? null);
      setDurationSeconds(report.duration_seconds ?? null);
      setIsPublic(report.is_public ?? false);
      setStatusMessage('Research complete');
      if (report.report != null) setReportText(report.report);
    };

    const checkProgress = async () => {
      if (controller.signal.aborted || checking) return;
      checking = true;
      try {
        const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]);
        const result = await getResearchProgress(sessionId, token, signal);
        if (controller.signal.aborted) return;
        failures = 0;
        if (result.content != null && (result.status === 'complete' || !result.status)) {
          complete({
            report: result.content,
            score: result.quality_score ?? undefined,
            duration_seconds: result.duration_seconds == null ? undefined : Number(result.duration_seconds),
            is_public: result.is_public,
          });
          return;
        }
        if (result.status === 'failed' || result.status === 'missing' || result.status === 'unauthorized') {
          showError(result.status === 'failed' ? 'Research failed. Start a new investigation to try again.'
            : result.status === 'missing' ? 'This research session could not be found.'
            : 'Your session has expired. Sign in again to view this report.');
          return;
        }
      } catch {
        if (controller.signal.aborted) return;
        failures++;
        if (fallback && failures >= 4) {
          showError('Could not reach the research server. Reconnect to check again.');
          return;
        }
      } finally {
        checking = false;
      }
      timer = setTimeout(checkProgress, fallback ? 4000 : 12000);
    };

    const recover = () => {
      if (controller.signal.aborted || fallback) return;
      fallback = true;
      failures = 0;
      clearTimeout(connectionTimer);
      stream?.close();
      setIsError(false);
      setStatusMessage('Live updates paused. Checking for the saved report…');
      clearTimeout(timer);
      timer = setTimeout(checkProgress, 0);
    };

    const handleEvent = (event: ResearchEvent) => {
      if (controller.signal.aborted || fallback) return;
      switch (event.type) {
        case 'connected':
          clearTimeout(connectionTimer);
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
          complete(event.data as ResearchComplete);
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

          if (message === 'Could not load research progress.') recover();
          else showError(message);
          break;
        }
      }
    };

    try {
      stream = getResearchStream(sessionId, token, handleEvent);
      stream.onerror = (event) => {
        if (!(event instanceof MessageEvent)) recover();
      };
      connectionTimer = setTimeout(recover, 10000);
      timer = setTimeout(checkProgress, 12000);
    } catch {
      timer = setTimeout(recover, 0);
    }
  }, [sessionId, token]);

  useEffect(() => {
    connectToStream();
    return () => stopConnection.current?.();
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

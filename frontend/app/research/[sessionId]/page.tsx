'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, RotateCcw, CheckCircle2, AlertCircle, Zap, ChevronRight, Info
} from 'lucide-react';
import Link from 'next/link';

import AgentTimeline from '../../../components/AgentTimeline';
import StreamingReport from '../../../components/StreamingReport';
import { getResearchStream, getSessionDetails } from '../../../lib/api';
import { ResearchEvent, ResearchStatus, ResearchComplete, ResearchToken, ResearchPlan } from '../../../types/research';

export default function ResearchPage() {
  const { sessionId } = useParams() as { sessionId: string };

  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [reportText, setReportText] = useState('');
  const [plan, setPlan] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Connecting to research agents...');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isError, setIsError] = useState(false);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchSavedReport = useCallback(async () => {
    try {
      const data = await getSessionDetails(sessionId);
      if (data?.content) {
        setReportText(data.content);
        setQualityScore(data.quality_score ?? null);
        setIsComplete(true);
        setStatusMessage('Report loaded from history.');
        setIsLoading(false);
        return true;
      }
    } catch {
      // not in DB yet, will stream live
    }
    return false;
  }, [sessionId]);

  const connectToStream = useCallback(async () => {
    if (!sessionId) return;
    setIsError(false);
    setIsComplete(false);
    setIsLoading(true);
    setReportText('');

    const alreadyDone = await fetchSavedReport();
    if (alreadyDone) return;

    const es = getResearchStream(sessionId, (event: ResearchEvent) => {
      switch (event.type) {
        case 'connected':
          setStatusMessage('Connected! Waiting for agents...');
          setIsLoading(false);
          break;
        case 'status': {
          const d = event.data as ResearchStatus;
          setActiveNode(d.node);
          setStatusMessage(d.message);
          if (d.node === 'synthesizer') setIsStreaming(true);
          break;
        }
        case 'plan':
          setPlan((event.data as ResearchPlan).plan);
          break;
        case 'token': {
          const text = typeof event.data === 'string' ? event.data : (event.data as ResearchToken).text;
          setReportText((prev) => prev + text);
          break;
        }
        case 'complete': {
          const d = event.data as ResearchComplete;
          setIsStreaming(false);
          setIsComplete(true);
          setQualityScore(d.score ?? null);
          setStatusMessage('Research complete!');
          if (d.report) setReportText(d.report);
          es.close();
          break;
        }
        case 'error': {
          const message = typeof event.data === 'string' ? event.data : (event.data as any).message;
          setIsError(true);
          setErrorMessage(message || 'An error occurred during research.');
          setIsStreaming(false);
          es.close();
          break;
        }
      }
    });

    es.onerror = () => {
      if (!isComplete) {
        setIsError(true);
        setErrorMessage('Connection lost. Research may still be running in the background.');
      }
      es.close();
      setIsLoading(false);
    };

    eventSourceRef.current = es;
    setIsLoading(false);
  }, [sessionId, fetchSavedReport, isComplete]);

  useEffect(() => {
    connectToStream();
    return () => {
      eventSourceRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Breadcrumb + Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-500 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div className="text-sm text-zinc-400 flex items-center gap-1">
            <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-zinc-600 font-medium">Research</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-blue-600 font-mono text-xs max-w-30 truncate">{sessionId}</span>
          </div>
        </div>

        {/* Status Banner */}
        <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border text-sm font-medium transition-all ${
          isError ? 'bg-red-50 border-red-200 text-red-700' :
          isComplete ? 'bg-green-50 border-green-200 text-green-700' :
          'bg-white border-zinc-200 text-zinc-700'
        }`}>
          {isLoading ? (
            <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : isError ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : isComplete ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <Zap className="w-4 h-4 text-blue-500 animate-pulse shrink-0" />
          )}
          <span>{isError ? errorMessage : statusMessage}</span>

          <div className="ml-auto flex items-center gap-2">
            {isError && (
              <button
                onClick={connectToStream}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reconnect
              </button>
            )}
            {isComplete && (
              <span className="flex items-center gap-1.5 text-green-700 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Complete
              </span>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* Left: Agent Timeline */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500" />
                <h2 className="font-semibold text-zinc-800 text-sm">Agent Pipeline</h2>
              </div>
              <div className="p-4">
                <AgentTimeline activeNode={activeNode} isComplete={isComplete} />
              </div>
            </div>

            {plan && (
              <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-blue-500" />
                  <h3 className="font-semibold text-zinc-800 text-sm">Research Strategy</h3>
                </div>
                <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap font-mono bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                  {plan}
                </p>
              </div>
            )}
          </div>

          {/* Right: Report */}
          <div className="lg:col-span-8">
            <StreamingReport
              content={reportText}
              isStreaming={isStreaming}
              qualityScore={qualityScore}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

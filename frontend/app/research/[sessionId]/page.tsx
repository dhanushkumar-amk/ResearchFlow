'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Zap,
  Info
} from 'lucide-react';
import Link from 'next/link';

import AgentTimeline from '../../../components/AgentTimeline';
import StreamingReport from '../../../components/StreamingReport';
import { getResearchStream, getSessionDetails } from '../../../lib/api';
import { ResearchEvent, ResearchStatus, ResearchComplete, ResearchToken, ResearchPlan } from '../../../types/research';

export default function ResearchPage() {
  const { sessionId } = useParams() as { sessionId: string };
  const router = useRouter();

  // State for live research progress
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [reportText, setReportText] = useState('');
  const [plan, setPlan] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Initializing research connection...');
  
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isError, setIsError] = useState(false);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Use a ref for the EventSource to handle cleanup correctly
  const eventSourceRef = useRef<EventSource | null>(null);

  const fetchSessionData = useCallback(async () => {
    if (!sessionId) return false;
    
    try {
      const data = await getSessionDetails(sessionId);
      
      if (data && data.content) {
        setReportText(data.content);
        setQualityScore(data.quality_score || null);
        setIsComplete(true);
        setStatusMessage('Research report loaded from history.');
        setIsLoading(false);
        return true; 
      }
    } catch (err) {
      console.log('Session result not available yet, starting live stream.');
    }
    return false;
  }, [sessionId]);

  const connectToStream = useCallback(async () => {
    if (!sessionId) return;

    // Reset UI state before connecting
    setIsError(false);
    setErrorMessage('');
    setIsComplete(false);
    setIsLoading(true);

    // First try to fetch from history
    const alreadyExists = await fetchSessionData();
    if (alreadyExists) return;

    try {
      const eventSource = getResearchStream(sessionId, (event: ResearchEvent) => {
        // Handle events from the wrapper
        switch (event.type) {
            case 'connected':
              setStatusMessage('Connection established. Waiting for agents...');
              setIsLoading(false);
              break;
              
            case 'status':
              const statusData = event.data as ResearchStatus;
              setActiveNode(statusData.node);
              setStatusMessage(statusData.message);
              if (statusData.node === 'synthesizer') {
                setIsStreaming(true);
              }
              break;
              
            case 'plan':
              const planData = event.data as ResearchPlan;
              setPlan(planData.plan);
              break;
              
            case 'token':
              const tokenData = event.data as ResearchToken;
              setReportText(prev => prev + tokenData.text);
              break;
              
            case 'complete':
              const completeData = event.data as ResearchComplete;
              setIsStreaming(false);
              setIsComplete(true);
              setQualityScore(completeData.score || null);
              setStatusMessage('Research successfully completed.');
              if (completeData.report) {
                 setReportText(completeData.report);
              }
              break;
              
            case 'error':
              const errorData = event.data as { message: string };
              setIsError(true);
              setErrorMessage(errorData.message || 'An unexpected research error occurred.');
              setIsStreaming(false);
              break;
          }
      });
      
      eventSourceRef.current = eventSource;

      eventSource.onerror = (err) => {
        console.error('EventSource connection error:', err);
        // Only set error if we are not already complete (re-connection often fails after normal completion)
        if (!isComplete) {
          setIsError(true);
          setErrorMessage('Connection lost. The research might still be running or was interrupted.');
        }
        eventSource.close();
      };

    } catch (err: any) {
      setIsError(true);
      setErrorMessage(err.message || 'Failed to establish connection.');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isComplete, fetchSessionData]);

  useEffect(() => {
    connectToStream();

    // Cleanup: close the EventSource when the component unmounts
    return () => {
      if (eventSourceRef.current) {
        console.log('🔌 [SSE] Cleaning up connection for session:', sessionId);
        eventSourceRef.current.close();
      }
    };
  }, [connectToStream, sessionId]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8 pt-24 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/40">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-500 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Live Research
              </h1>
              <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1 font-mono">
                <span className="opacity-70">Session ID:</span>
                <span>{sessionId}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isError && (
              <button
                onClick={connectToStream}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reconnect</span>
              </button>
            )}
            
            {isComplete && (
              <div className="flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl font-semibold shadow-lg shadow-green-500/20 animate-in zoom-in-95 duration-500">
                <CheckCircle2 className="w-5 h-5" />
                <span>Research Complete</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        <div className={`p-4 rounded-2xl border transition-all duration-500 flex items-center gap-4 shadow-sm ${
          isError ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400' :
          isComplete ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400' :
          'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
        }`}>
          {isError ? (
            <AlertCircle className="w-6 h-6 shrink-0" />
          ) : isComplete ? (
            <CheckCircle2 className="w-6 h-6 shrink-0" />
          ) : (
            <Zap className="w-6 h-6 text-blue-600 animate-pulse shrink-0" />
          )}
          <span className="font-medium">{isError ? errorMessage : statusMessage}</span>
        </div>

        {/* Main Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Progress Tracking */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
               <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                 <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black">
                   <Zap className="w-4 h-4" />
                 </div>
                 <h2 className="font-bold text-zinc-900 dark:text-zinc-50">Agent Timeline</h2>
               </div>
               <div className="p-2">
                 <AgentTimeline 
                   activeNode={activeNode} 
                   isComplete={isComplete} 
                 />
               </div>
            </div>

            {/* Strategy Card - Shown when plan is available */}
            {plan && (
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-md transition-all duration-700 animate-in slide-in-from-left-4 fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                    <Info className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Current Strategy</h3>
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 font-mono whitespace-pre-wrap leading-relaxed">
                  {plan}
                </div>
              </div>
            )}
          </div>

          {/* Right: Streaming Results */}
          <div className="lg:col-span-8">
            <StreamingReport 
              content={reportText} 
              isStreaming={isStreaming}
              qualityScore={qualityScore}
            />
          </div>
        </div>
      </div>

      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[20%] -right-[15%] w-[45%] h-[45%] bg-blue-500/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[150px] rounded-full" />
      </div>
    </div>
  );
}

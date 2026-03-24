'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Copy, Check, Award, FileText } from 'lucide-react';

interface StreamingReportProps {
  content: string;
  isStreaming: boolean;
  qualityScore?: number | null;
}

export default function StreamingReport({ 
  content, 
  isStreaming, 
  qualityScore 
}: StreamingReportProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="px-8 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 leading-none">
              Research Report
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              {isStreaming ? 'Synthesizing findings...' : 'Analysis Complete'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isStreaming && qualityScore !== undefined && qualityScore !== null && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-500 border border-yellow-200/50 dark:border-yellow-700/30 rounded-lg text-sm font-semibold animate-in zoom-in duration-500">
              <Award className="w-4 h-4" />
              <span>Quality Score: {qualityScore}/10</span>
            </div>
          )}
          
          <button
            onClick={handleCopy}
            disabled={!content}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-400 dark:text-green-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-8 md:p-12 min-h-[400px]">
        {content ? (
          <div className="report-content prose dark:prose-invert max-w-none">
            <ReactMarkdown>
              {content}
            </ReactMarkdown>
            {isStreaming && <span className="streaming-cursor" aria-hidden="true" />}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center animate-pulse">
              <Sparkles className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
            </div>
            <p className="text-zinc-400 dark:text-zinc-500 text-sm">
              Waiting for synthesizer to begin writing...
            </p>
          </div>
        )}
      </div>

      {/* Footer / Status Bar - Show progress if streaming */}
      {isStreaming && (
        <div className="px-8 py-3 bg-blue-50/50 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-900/20 flex items-center gap-3">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </div>
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Live Stream Active
          </span>
        </div>
      )}
    </div>
  );
}

function Sparkles({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

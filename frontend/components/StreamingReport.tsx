'use client';

import React, { useState } from 'react';
import { Copy, Check, Award, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface StreamingReportProps {
  content: string;
  isStreaming: boolean;
  qualityScore?: number | null;
}

export default function StreamingReport({ content, isStreaming, qualityScore }: StreamingReportProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  return (
    <div className="w-full bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-800 leading-none">Research Report</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isStreaming ? 'Synthesizing findings...' : content ? 'Analysis complete' : 'Waiting for agents...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isStreaming && qualityScore != null && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              Score: {qualityScore}/10
            </div>
          )}
          <button
            onClick={handleCopy}
            disabled={!content}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-white rounded-lg text-xs font-semibold hover:bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8 min-h-[400px]">
        {content ? (
          <div className="report-content">
            <ReactMarkdown>{content}</ReactMarkdown>
            {isStreaming && <span className="streaming-cursor" aria-hidden="true" />}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-3">
            <div className="w-12 h-12 bg-zinc-100 rounded-xl flex items-center justify-center animate-pulse">
              <FileText className="w-6 h-6 text-zinc-300" />
            </div>
            <p className="text-zinc-400 text-sm">Report will appear here as the AI writes it...</p>
          </div>
        )}
      </div>

      {/* Streaming indicator */}
      {isStreaming && (
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-100 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Live stream active</span>
        </div>
      )}
    </div>
  );
}

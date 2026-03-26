'use client';

import React, { useState } from 'react';
import { Copy, Check, Award, FileText, Sparkles, Download, FileJson } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Mermaid from './Mermaid';

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

  const handleDownload = () => {
    if (!content) return;
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `Research_Report_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="w-full bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 leading-none">Research Portfolio</h2>
            <p className="text-[10px] text-zinc-500 mt-1.5 font-bold uppercase tracking-widest flex items-center gap-1.5">
              {isStreaming ? (
                <>
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping" />
                  Live Synthesizing...
                </>
              ) : content ? (
                <>
                  <Check className="w-3 h-3 text-green-600" />
                  Full Analysis Ready
                </>
              ) : (
                'System Initialization...'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isStreaming && qualityScore != null && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold shadow-xs">
              <Award className="w-3.5 h-3.5" />
              Quality Index: {qualityScore}/10
            </div>
          )}
          
          <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-xl p-0.5 shadow-sm">
             <button
                onClick={handleCopy}
                disabled={!content}
                className="p-2 text-zinc-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-30 tooltip"
             >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
             </button>
             <button
                onClick={handleDownload}
                disabled={!content}
                className="p-2 text-zinc-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all disabled:opacity-30"
             >
                <Download className="w-4 h-4" />
             </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 md:p-14 overflow-y-auto max-h-300 prose prose-zinc prose-sm md:prose-base max-w-none prose-headings:font-bold prose-h1:text-4xl prose-h1:text-zinc-900 prose-h1:mt-0 prose-h2:text-2xl prose-h2:border-b-2 prose-h2:border-zinc-100 prose-h2:pb-3 prose-h2:mt-12 prose-strong:text-zinc-900 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/20 prose-blockquote:p-6 prose-blockquote:rounded-2xl prose-blockquote:not-italic prose-li:my-1.5">
        {content ? (
          <div className="report-content-body font-sans text-zinc-800 leading-relaxed text-lg">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  const value = String(children).replace(/\n$/, '');

                  if (language === 'mermaid') {
                    return <Mermaid chart={value} />;
                  }

                  return (
                    <code className={`${className} bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded-md font-mono text-sm border border-zinc-200`} {...props}>
                      {children}
                    </code>
                  );
                },
                table({ children }) {
                  return (
                    <div className="my-10 overflow-x-auto rounded-2xl border border-zinc-200 shadow-sm bg-white">
                      <table className="min-w-full divide-y divide-zinc-200 text-base">
                        {children}
                      </table>
                    </div>
                  );
                },
                thead({ children }) { return <thead className="bg-zinc-50/80">{children}</thead>; },
                th({ children }) { return <th className="px-6 py-4 text-left text-xs font-black text-zinc-400 uppercase tracking-[2px]">{children}</th>; },
                td({ children }) { return <td className="px-6 py-5 whitespace-nowrap text-zinc-600 border-t border-zinc-100 font-medium">{children}</td>; }
              }}
            >
              {content}
            </ReactMarkdown>
            
            {isStreaming && (
               <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg animate-pulse mt-8 border border-blue-500 uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" /> Intelligence Stream Active
               </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-120 text-center space-y-6">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center animate-bounce shadow-inner">
              <Sparkles className="w-10 h-10 text-blue-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-900 uppercase tracking-widest">Synthesizing...</h3>
              <p className="text-zinc-500 text-sm max-w-62.5 mx-auto font-medium mt-2">
                 Agents are combining global archives with your private storage to build a comprehensive report.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Streaming Status */}
      <div className="px-6 py-4 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className="flex gap-1.5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-blue-500 animate-pulse' : 'bg-zinc-300'}`} style={{ animationDelay: `${i * 150}ms` }} />
                ))}
             </div>
             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                {isStreaming ? 'Stream Synchronized' : 'Session Resting'}
             </span>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-zinc-200 rounded-lg text-[10px] font-black text-zinc-500 uppercase">
                <FileJson className="w-3 h-3" /> {content.length} CHARS
             </div>
             {content && (
                <button onClick={handleDownload} className="text-[10px] font-black text-blue-600 uppercase hover:underline">
                   Download MD
                </button>
             )}
          </div>
      </div>
    </div>
  );
}

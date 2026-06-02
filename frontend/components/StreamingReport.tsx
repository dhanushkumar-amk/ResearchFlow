'use client';

import React, { useState } from 'react';
import { Copy, Check, Award, FileText, Sparkles, Download, FileJson, Share2, FileCode, CheckCircle2, Globe, Lock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Mermaid from './Mermaid';
import { exportToPDF, exportToDOCX, exportToJSON } from '../lib/exportUtils';
import { motion, AnimatePresence } from 'framer-motion';

interface StreamingReportProps {
  content: string;
  isStreaming: boolean;
  qualityScore?: number | null;
  durationSeconds?: number | null;
  onCitationHover?: (id: string | null) => void;
  sessionId?: string;
  isPublic?: boolean;
  onTogglePublic?: (val: boolean) => void;
  layout?: 'default' | 'medium';
}

export default function StreamingReport({ 
  content, 
  isStreaming, 
  qualityScore, 
  durationSeconds, 
  onCitationHover, 
  sessionId, 
  isPublic, 
  onTogglePublic,
  layout = 'default'
}: StreamingReportProps) {
  const [copied, setCopied] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleCopy = async () => {
    try {
      if (isPublic && sessionId) {
        const shareUrl = `${window.location.origin}/share/${sessionId}`;
        await navigator.clipboard.writeText(shareUrl);
      } else {
        await navigator.clipboard.writeText(content);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  const handleExport = async (type: 'pdf' | 'docx' | 'json' | 'md') => {
    const filename = `Research_Report_${new Date().toISOString().split('T')[0]}`;
    setIsExportOpen(false);

    switch (type) {
      case 'pdf':
        await exportToPDF('report-content-body', `${filename}.pdf`);
        break;
      case 'docx':
        await exportToDOCX(content, "Intelligence Portfolio", `${filename}.docx`);
        break;
      case 'json':
        exportToJSON({ content, qualityScore, timestamp: new Date() }, `${filename}.json`);
        break;
      case 'md':
        const element = document.createElement('a');
        const file = new Blob([content], { type: 'text/markdown' });
        element.href = URL.createObjectURL(file);
        element.download = `${filename}.md`;
        element.click();
        break;
    }
  };

  const parseCitations = (text: string) => {
    if (!onCitationHover) return text;
    const parts = text.split(/(\[(?:Web Source|Document Context) \d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[(Web Source|Document Context) (\d+)\]/);
      if (match) {
        const type = match[1] === 'Web Source' ? 'web' : 'rag';
        const index = match[2];
        const id = `${type}_${index}`;
        return (
          <span 
            key={i}
            onMouseEnter={() => onCitationHover(id)}
            onMouseLeave={() => onCitationHover(null)}
            className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-750 font-black text-[10px] cursor-help border border-emerald-100 mx-0.5 hover:bg-emerald-100 transition-colors shadow-xs"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  if (layout === 'medium') {
    return (
      <div className="w-full flex flex-col bg-white">
        {/* Content with Medium-style sans-serif typography */}
        <div className="py-4 md:py-6 overflow-y-visible prose prose-slate prose-lg md:prose-xl max-w-none prose-sans leading-relaxed text-slate-800" id="report-content-body">
          {content ? (
            <div className="report-content-body font-sans text-slate-800 leading-relaxed text-lg">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                components={{
                  p({ children }) {
                    return (
                      <p className="mb-6">
                        {React.Children.map(children, (child) =>
                          typeof child === 'string' ? parseCitations(child) : child
                        )}
                      </p>
                    );
                  },
                  code({ className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';
                    const value = String(children).replace(/\n$/, '');
  
                    if (language === 'mermaid') {
                      return <Mermaid chart={value} isStreaming={isStreaming} />;
                    }
  
                    return (
                      <code className={`${className} bg-slate-50 text-slate-850 px-1.5 py-0.5 rounded-md font-mono text-sm border border-slate-200`} {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre({ children }: any) {
                    const childrenArray = React.Children.toArray(children);
                    const hasMermaid = childrenArray.some(
                      (child) =>
                        React.isValidElement(child) &&
                        (child.props as any)?.className?.includes('language-mermaid')
                    );

                    if (hasMermaid) {
                      return <>{children}</>;
                    }
                    return (
                      <pre className="bg-slate-50 border border-slate-200 rounded-2xl p-6 overflow-x-auto font-mono text-sm text-slate-800 leading-normal my-6">
                        {children}
                      </pre>
                    );
                  },
                   table({ children }) {
                     return (
                       <div className="not-prose my-10 overflow-x-auto rounded-2xl border border-slate-200 shadow-[0_4px_24px_rgba(0,0,0,0.02)] bg-white">
                         <table className="min-w-full divide-y divide-slate-150 text-sm">
                           {children}
                         </table>
                       </div>
                     );
                   },
                   thead({ children }) { return <thead className="bg-slate-50 border-b border-slate-100">{children}</thead>; },
                   th({ children }) { return <th className="px-6 py-4.5 text-left text-[10px] font-black text-slate-450 uppercase tracking-wider">{children}</th>; },
                   tr({ children }) { return <tr className="hover:bg-slate-50/30 transition-colors duration-200">{children}</tr>; },
                   td({ children }) { return <td className="px-6 py-4 whitespace-normal break-words text-slate-600 border-t border-slate-100 text-sm font-medium leading-relaxed max-w-md">{children}</td>; }
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-80 text-center space-y-6 py-20">
              <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center animate-bounce shadow-inner">
                <Sparkles className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Synthesizing Report...</h3>
                <p className="text-slate-550 text-sm max-w-62.5 mx-auto font-medium mt-2">
                   Please wait while our parallel multi-agent system completes synthesis.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default layout (scrolling card with header/footer)
  return (
    <div className="w-full bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-900 leading-none">Research Portfolio</h2>
            <p className="text-[10px] text-zinc-500 mt-1.5 font-bold uppercase tracking-widest flex items-center gap-1.5">
              {isStreaming ? (
                <>
                  <span className="w-1.5 h-1.5 bg-emerald-550 rounded-full animate-ping" />
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
          {!isStreaming && content && (
            <div className="flex items-center gap-2 mr-2">
              <button
                onClick={() => onTogglePublic?.(!isPublic)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  isPublic 
                    ? 'bg-green-550/10 text-green-700 border-green-200 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                    : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                }`}
              >
                {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {isPublic ? 'Publicly Shared' : 'Private'}
              </button>
            </div>
          )}

          {!isStreaming && qualityScore != null && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold shadow-xs">
              <Award className="w-3.5 h-3.5" />
              Quality Index: {qualityScore}/10
            </div>
          )}

          {!isStreaming && durationSeconds != null && !isNaN(Number(durationSeconds)) && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Enlightenment Time: {Number(durationSeconds).toFixed(1)}s
            </div>
          )}
          
          <div className="flex items-center gap-1 bg-white border border-zinc-200 rounded-xl p-0.5 shadow-sm relative">
             <button
                onClick={handleCopy}
                disabled={!content}
                title={isPublic ? "Copy Public Link" : "Copy Report Content"}
                className={`p-2 rounded-lg transition-all disabled:opacity-30 tooltip ${copied ? 'text-green-600 bg-green-50' : 'text-zinc-650 hover:text-emerald-605 hover:bg-emerald-50'}`}
             >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
             </button>
             
             <button
                onClick={() => setIsExportOpen(!isExportOpen)}
                disabled={!content}
                className={`p-2 rounded-lg transition-all disabled:opacity-30 ${isExportOpen ? 'text-emerald-605 bg-emerald-50' : 'text-zinc-650 hover:text-emerald-605 hover:bg-emerald-50'}`}
             >
                <Download className="w-4 h-4" />
             </button>

             <AnimatePresence>
                {isExportOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2.5 w-48 bg-white border border-zinc-200 rounded-2xl shadow-2xl p-2 z-10 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-50 mb-1">
                      Export Intelligence
                    </div>
                    <button onClick={() => handleExport('pdf')} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-emerald-50 text-zinc-700 hover:text-emerald-700 rounded-xl text-xs font-bold transition-colors text-left cursor-pointer">
                      <FileText className="w-4 h-4 text-red-500" /> Professional PDF
                    </button>
                    <button onClick={() => handleExport('docx')} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-emerald-50 text-zinc-700 hover:text-emerald-700 rounded-xl text-xs font-bold transition-colors text-left cursor-pointer">
                      <FileCode className="w-4 h-4 text-emerald-555" /> Microsoft Word
                    </button>
                    <button onClick={() => handleExport('md')} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-emerald-50 text-zinc-700 hover:text-emerald-700 rounded-xl text-xs font-bold transition-colors text-left cursor-pointer">
                      <Download className="w-4 h-4 text-zinc-600" /> Markdown (Raw)
                    </button>
                    <button onClick={() => handleExport('json')} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-emerald-50 text-zinc-700 hover:text-emerald-700 rounded-xl text-xs font-bold transition-colors border-t border-zinc-50 mt-1 text-left cursor-pointer">
                      <Sparkles className="w-4 h-4 text-amber-500" /> Research JSON
                    </button>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8 md:p-14 overflow-y-auto max-h-300 prose prose-zinc prose-sm md:prose-base max-w-none prose-headings:font-bold prose-h1:text-4xl prose-h1:text-zinc-900 prose-h1:mt-0 prose-h2:text-2xl prose-h2:border-b-2 prose-h2:border-zinc-100 prose-h2:pb-3 prose-h2:mt-12 prose-strong:text-zinc-900 prose-blockquote:border-emerald-500 prose-blockquote:bg-emerald-50/20 prose-blockquote:p-6 prose-blockquote:rounded-2xl prose-blockquote:not-italic prose-li:my-1.5 bg-white" id="report-content-body">
        {content ? (
          <div className="report-content-body font-sans text-zinc-800 leading-relaxed text-lg">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                p({ children }) {
                  return (
                    <p>
                      {React.Children.map(children, (child) =>
                        typeof child === 'string' ? parseCitations(child) : child
                      )}
                    </p>
                  );
                },
                code({ className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : '';
                  const value = String(children).replace(/\n$/, '');

                  if (language === 'mermaid') {
                    return <Mermaid chart={value} isStreaming={isStreaming} />;
                  }

                  return (
                    <code className={`${className} bg-zinc-100 text-zinc-805 px-1.5 py-0.5 rounded-md font-mono text-sm border border-zinc-200`} {...props}>
                      {children}
                    </code>
                  );
                },
                pre({ children }: any) {
                  const childrenArray = React.Children.toArray(children);
                  const hasMermaid = childrenArray.some(
                    (child) =>
                      React.isValidElement(child) &&
                      (child.props as any)?.className?.includes('language-mermaid')
                  );

                  if (hasMermaid) {
                    return <>{children}</>;
                  }
                  return (
                    <pre className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 overflow-x-auto font-mono text-sm text-zinc-800 leading-normal my-6">
                      {children}
                    </pre>
                  );
                },
                 table({ children }) {
                   return (
                     <div className="not-prose my-10 overflow-x-auto rounded-2xl border border-zinc-150 shadow-[0_4px_24px_rgba(0,0,0,0.02)] bg-white">
                       <table className="min-w-full divide-y divide-zinc-100 text-sm">
                         {children}
                       </table>
                     </div>
                   );
                 },
                 thead({ children }) { return <thead className="bg-zinc-50/80 border-b border-zinc-100">{children}</thead>; },
                 th({ children }) { return <th className="px-6 py-4.5 text-left text-[10px] font-black text-zinc-405 uppercase tracking-[1.5px]">{children}</th>; },
                 tr({ children }) { return <tr className="hover:bg-zinc-50/30 transition-colors duration-200">{children}</tr>; },
                 td({ children }) { return <td className="px-6 py-4.5 whitespace-normal break-words text-zinc-650 border-t border-zinc-100 text-sm font-medium leading-relaxed max-w-md">{children}</td>; }
              }}
            >
              {content}
            </ReactMarkdown>

            {isStreaming && (
               <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-emerald-550 text-white rounded-2xl text-xs font-black shadow-lg animate-pulse mt-8 border border-emerald-500 uppercase tracking-widest">
                  <Sparkles className="w-3.5 h-3.5" /> Intelligence Stream Active
               </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-120 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center animate-bounce shadow-inner">
              <Sparkles className="w-10 h-10 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-xl font-black text-zinc-900 uppercase tracking-widest">Synthesizing...</h3>
              <p className="text-zinc-550 text-sm max-w-62.5 mx-auto font-medium mt-2">
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
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${isStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`} style={{ animationDelay: `${i * 150}ms` }} />
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
                <button onClick={() => handleExport('md')} className="text-[10px] font-black text-emerald-600 uppercase hover:underline cursor-pointer">
                   Download MD
                </button>
             )}
          </div>
      </div>
    </div>
  );
}

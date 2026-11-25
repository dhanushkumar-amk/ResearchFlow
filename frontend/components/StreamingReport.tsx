'use client';

import { Children, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Mermaid from './Mermaid';
import { exportToPDF, exportToDOCX, exportToJSON } from '../lib/exportUtils';

interface StreamingReportProps {
  content: string;
  isStreaming: boolean;
  qualityScore?: number | null;
  durationSeconds?: number | null;
  sessionId?: string;
  isPublic?: boolean;
  onTogglePublic?: (value: boolean) => void;
  layout?: 'default' | 'medium';
}

const formats = [
  { type: 'pdf', label: 'PDF' },
  { type: 'docx', label: 'Word (.docx)' },
  { type: 'md', label: 'Markdown' },
  { type: 'json', label: 'JSON' },
] as const;

function citations(text: string) {
  return text.split(/(\[(?:Web Source|Document Context) \d+\])/g).map((part, index) =>
    /^\[(?:Web Source|Document Context) \d+\]$/.test(part) ? <span className="rf-citation" key={index}>{part}</span> : part
  );
}

export default function StreamingReport({
  content, isStreaming, qualityScore, durationSeconds, sessionId, isPublic, onTogglePublic, layout = 'default',
}: StreamingReportProps) {
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState('');
  const isReadingView = layout === 'medium';

  const handleCopy = async () => {
    setActionError('');
    try {
      await navigator.clipboard.writeText(isPublic && sessionId ? `${window.location.origin}/share/${sessionId}` : content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionError('Could not copy to the clipboard.');
    }
  };

  const handleExport = async (type: (typeof formats)[number]['type'], details: HTMLDetailsElement | null) => {
    if (details) details.open = false;
    setActionError('');
    const name = `Research_Report_${new Date().toISOString().slice(0, 10)}`;
    try {
      if (type === 'pdf') await exportToPDF('report-content-body', `${name}.pdf`);
      if (type === 'docx') await exportToDOCX(content, 'Research report', `${name}.docx`);
      if (type === 'json') exportToJSON({ content, qualityScore, timestamp: new Date() }, `${name}.json`);
      if (type === 'md') {
        const link = document.createElement('a');
        const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown' }));
        link.href = url;
        link.download = `${name}.md`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch {
      setActionError('Could not export the report.');
    }
  };

  const markdownComponents: Components = {
    p({ children }) {
      return <p>{Children.map(children, child => typeof child === 'string' ? citations(child) : child)}</p>;
    },
    pre({ node, children }) {
      const code = node?.children[0];
      if (code?.type === 'element' && Array.isArray(code.properties.className) && code.properties.className.includes('language-mermaid')) {
        const chart = code.children.map(child => child.type === 'text' ? child.value : '').join('').trim();
        return <Mermaid chart={chart} isStreaming={isStreaming} />;
      }
      return <pre>{children}</pre>;
    },
    table({ children }) {
      return <div className="rf-report-table"><table>{children}</table></div>;
    },
  };

  return (
    <article className={isReadingView ? 'min-w-0' : 'rf-report'}>
      {!isReadingView && (
        <header className="rf-report-toolbar">
          <div>
            <strong>Report</strong>
            <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-zinc-600">
              {isStreaming && <span>Drafting…</span>}
              {!isStreaming && qualityScore != null && <span>Score {qualityScore}/10</span>}
              {!isStreaming && durationSeconds != null && Number.isFinite(Number(durationSeconds)) && <span>{Number(durationSeconds).toFixed(1)} s</span>}
            </div>
          </div>
          {content && (
            <div className="flex flex-wrap items-center gap-2">
              {!isStreaming && onTogglePublic && <button type="button" className="rf-report-control" aria-pressed={isPublic === true} onClick={() => onTogglePublic(!isPublic)}>{isPublic ? 'Public' : 'Private'}</button>}
              <button type="button" className="rf-report-control" onClick={handleCopy} aria-label={copied ? 'Copied' : isPublic ? 'Copy public link' : 'Copy report'}>
                {copied ? <Check size={16} /> : <Copy size={16} />} <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <details className="relative">
                <summary className="rf-report-control"><Download size={16} /> Export</summary>
                <div className="rf-export-menu">
                  {formats.map(({ type, label }) => (
                    <button key={type} type="button" onClick={event => handleExport(type, event.currentTarget.closest('details'))}>{label}</button>
                  ))}
                </div>
              </details>
            </div>
          )}
        </header>
      )}
      {actionError && <p className="px-5 py-2 text-sm text-red-700" role="alert">{actionError}</p>}
      <div className={`rf-report-text prose prose-zinc ${isReadingView ? 'rf-report-reading' : ''}`} id="report-content-body">
        {content ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown> : <p className="text-zinc-600">The report will appear here when drafting begins.</p>}
      </div>
    </article>
  );
}

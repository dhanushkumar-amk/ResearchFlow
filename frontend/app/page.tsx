'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Clock, FileText, Upload } from 'lucide-react';
import Link from 'next/link';
import { getResearchHistory, startResearch } from '../lib/api';
import { ResearchHistoryItem } from '../types/research';

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<ResearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem('research_session_id') || ('user_' + Math.random().toString(36).substring(2, 9));
    localStorage.setItem('research_session_id', storedId);
    setSessionId(storedId);
    getResearchHistory(storedId).then(setHistory).catch(() => {});
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || isLoading || !sessionId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { sessionId: newSessionId } = await startResearch(q, sessionId);
      // Navigate to live research page
      router.push(`/research/${newSessionId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start research. Is the backend running?';
      setError(msg);
      setIsLoading(false);
    }
  };

  const suggestions = ['AI Agents in 2025', 'Quantum Computing advances', 'Blockchain in healthcare', 'Climate tech startups'];

  return (
    <div className="flex flex-col min-h-screen bg-white pt-16">
      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-sm font-medium border border-blue-100">
            <Sparkles className="w-3.5 h-3.5" />
            Multi-Agent AI Research Engine
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-zinc-900 leading-tight">
              Research anything,{' '}
              <span className="text-blue-600">instantly.</span>
            </h1>
            <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
              Ask a question. Our AI agents search the web, analyze documents, and deliver a comprehensive report in seconds.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you want to research?"
              className="w-full px-6 py-5 pr-36 text-lg border-2 border-zinc-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 bg-white shadow-lg shadow-zinc-100 transition-all placeholder-zinc-400 text-zinc-900"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-semibold rounded-xl transition-all active:scale-95 shadow-md"
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
              ) : (
                <>Research <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-left">
              ⚠️ {error}
            </div>
          )}

          {/* Suggestions */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-zinc-400">Try:</span>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="text-sm px-3 py-1.5 bg-zinc-50 hover:bg-blue-50 text-zinc-600 hover:text-blue-600 border border-zinc-200 hover:border-blue-200 rounded-lg transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Recent Research */}
      {history.length > 0 && (
        <section className="max-w-3xl mx-auto w-full px-4 pb-20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-zinc-700 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Recent Research
            </h2>
            <Link href="/history" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {history.slice(0, 5).map((item) => (
              <Link
                key={item.session_id}
                href={`/research/${item.session_id}`}
                className="flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium text-zinc-800 truncate group-hover:text-blue-600 transition-colors">
                    {item.query}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {item.quality_score !== null && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      item.quality_score >= 8 ? 'bg-green-50 text-green-600' :
                      item.quality_score >= 6 ? 'bg-amber-50 text-amber-600' :
                      'bg-red-50 text-red-600'
                    }`}>
                      {item.quality_score}/10
                    </span>
                  )}
                  <span className="text-xs text-zinc-400">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-blue-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA if no history */}
      {history.length === 0 && (
        <div className="max-w-3xl mx-auto w-full px-4 pb-20">
          <div className="p-8 bg-zinc-50 border border-zinc-200 rounded-2xl text-center space-y-4">
            <Upload className="w-10 h-10 mx-auto text-zinc-300" />
            <p className="text-zinc-500 text-sm">No research yet — try asking something above, or upload documents to enhance research quality.</p>
            <Link href="/documents" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline">
              Upload Documents <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

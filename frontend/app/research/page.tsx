'use client';

import ObservatoryArt from '../../components/ObservatoryArt';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  AlertCircle,
  Clock,
  Compass,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { startResearch, getAllResearchHistory } from '../../lib/api';
import { ResearchHistoryItem } from '../../types/research';
import { useAuth } from '../../lib/AuthContext';
import { motion } from 'framer-motion';

export default function GeneralResearchPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<ResearchHistoryItem[]>([]);

  useEffect(() => {
    if (!token) return;
    getAllResearchHistory(token)
      .then((data) => setHistory(data.slice(0, 4)))
      .catch((err) => console.error('Failed to load recent sessions', err));
  }, [token]);

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const q = (overrideQuery || query).trim();
    if (!q || isLoading || !token) return;

    setIsLoading(true);
    setError(null);

    try {
      const newSessionId = crypto.randomUUID();
      await startResearch(q, newSessionId, token);
      router.push(`/research/${newSessionId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start research. Is the backend running?';
      setError(msg);
      setIsLoading(false);
    }
  };

  const suggestions = [
    'Analyze EV solid-state battery commercialization timeline for 2026-2030.',
    'Synthesize advancements in model pruning vs quantization for local LLMs.',
    'Review therapeutic efficacy of GLP-1 agonists beyond glycemic control.',
    'Market opportunities in decentralized finance and AI auditing in 2026.'
  ];

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] pt-10 md:pt-14 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans antialiased selection:bg-indigo-50 selection:text-indigo-700">

      {/* Background Decorative Glows matching Landing Page */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/[0.02] rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-teal-500/[0.015] rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.25] pointer-events-none z-0" />

      <div className="max-w-[850px] mx-auto space-y-8 relative z-10">

        <header className="rf-dashboard-banner rf-workspace-hero">
          <ObservatoryArt className="rf-workspace-hero-art" sizes="(max-width: 767px) 100vw, 320px" />
          <div className="rf-workspace-hero-content">
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">Start a new investigation</h1>
            <p className="max-w-xl text-base leading-relaxed text-slate-600">Ask a specific question. ResearchFlow will search the web and your library, then write a report based on the sources it finds.</p>
          </div>
        </header>

        {/* Query Input Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-white border border-neutral-200/80 rounded-xl p-5 sm:p-6   transition-all duration-300 relative overflow-hidden"
        >
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="research-question" className="mb-2 block text-sm font-semibold text-slate-800">Research question</label>
              <textarea
                id="research-question"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="How has solid-state battery technology progressed toward commercial use?"
                className="min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm leading-relaxed text-slate-950 placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white"
                maxLength={1000}
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <small className="text-slate-600">{query.length}/1000 characters</small>
              <button
                type="submit"
                aria-busy={isLoading}
                aria-label={isLoading ? 'Starting research' : undefined}
                disabled={!query.trim() || isLoading}
                className="bg-[var(--rf-accent)] hover:bg-[var(--rf-accent-hover)] disabled:bg-neutral-100 disabled:text-neutral-400 text-white text-xs font-bold px-6 py-3 rounded-[8px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer  "
              >
                {isLoading ? (
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <>
                    Start research
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div role="alert" className="mt-4 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </motion.div>

        {/* Suggestions & History */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">

          {/* Query Suggestion List */}
          <motion.div
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-3"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" /> Suggested questions
            </h3>
            <div className="space-y-2">
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="w-full text-left p-3 bg-white border border-neutral-100 hover:border-indigo-300 hover:bg-indigo-50/60 rounded-xl text-xs text-neutral-600 font-medium transition-all cursor-pointer leading-relaxed hover:shadow-xs group flex items-start gap-2"
                >
                  <span className="flex-1 line-clamp-2">{s}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Quick history checklist to relaunch previous queries */}
          <motion.div
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="space-y-3"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Recent research
            </h3>
            <div className="space-y-2">
              {history.length > 0 ? (
                history.map((item) => (
                  <Link
                    key={item.session_id}
                    href={`/research/${item.session_id}`}
                    className="flex items-center justify-between p-3 bg-white border border-neutral-100 hover:border-neutral-250 rounded-xl text-xs text-neutral-600 font-semibold transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0 group-hover:text-indigo-500" />
                      <span className="truncate group-hover:text-[#0a0a0a]">{item.query}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-[#0a0a0a] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </Link>
                ))
              ) : (
                <div className="text-center py-8 border border-dashed border-neutral-200 rounded-xl text-xs text-neutral-400">
                  No research records found.
                </div>
              )}

              <Link
                href="/history"
                className="block text-center p-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-250 rounded-xl text-[11px] font-bold text-neutral-600 transition-all"
              >
                View history
              </Link>
            </div>
          </motion.div>

        </div>

      </div>
    </div>
  );
}

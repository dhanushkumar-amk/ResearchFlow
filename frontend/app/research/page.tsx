'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  Search,
  AlertCircle,
  HelpCircle,
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
    <div className="min-h-screen bg-white text-[#0a0a0a] pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans antialiased selection:bg-emerald-50 selection:text-emerald-700">

      {/* Background Decorative Glows matching Landing Page */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/[0.02] rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-teal-500/[0.015] rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.25] pointer-events-none z-0" />

      <div className="max-w-[720px] mx-auto space-y-12 relative z-10">

        {/* Header Title */}
        <div className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex justify-center"
          >
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3.5 py-1.2 rounded-full text-[10px] font-mono border border-emerald-100/70 font-semibold shadow-xs select-none">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Multi-Agent Research Launchpad</span>
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="text-[36px] sm:text-[44px] font-black tracking-tight leading-[1.1] text-[#0a0a0a]"
          >
            What are we investigating{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
              today?
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-[14px] text-neutral-500 max-w-xl mx-auto leading-relaxed"
          >
            Submit your research prompt. Our AI team will compile search parameters, cross-examine database vectors, and deliver a grounded report.
          </motion.p>
        </div>

        {/* Query Input Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-white border border-neutral-200/80 rounded-2xl p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.05)] transition-all duration-300 relative overflow-hidden"
        >
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative group">
              <div className="absolute left-4.5 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-emerald-500 transition-colors">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="EV solid-state batteries maturity 2026..."
                className="w-full pl-12 pr-4 py-4 text-[15px] border border-neutral-200 rounded-xl outline-none focus:border-emerald-500/80 focus:ring-4 focus:ring-emerald-500/[0.04] bg-neutral-50/20 focus:bg-white transition-all placeholder-neutral-400 text-[#0a0a0a]"
                disabled={isLoading}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between pt-2">
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-450">
                <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
                <span>Supports complex multi-sentence questions</span>
              </div>

              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-100 disabled:text-neutral-400 text-white text-xs font-bold px-6 py-3 rounded-[8px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_14px_rgba(16,185,129,0.2)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.3)]"
              >
                {isLoading ? (
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <>
                    Initialize Research
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-xs flex items-start gap-2.5">
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
              <Compass className="w-3.5 h-3.5" /> Suggested Inquiries
            </h3>
            <div className="space-y-2">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(s)}
                  className="w-full text-left p-3 bg-white border border-neutral-100 hover:border-emerald-500/20 hover:bg-emerald-50/[0.05] rounded-xl text-xs text-neutral-600 font-medium transition-all cursor-pointer leading-relaxed hover:shadow-xs group flex items-start gap-2"
                >
                  <span className="text-[10px] font-mono text-neutral-400 mt-0.5 group-hover:text-emerald-500">0{idx + 1}</span>
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
              <Clock className="w-3.5 h-3.5" /> Recent Sessions
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
                      <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0 group-hover:text-emerald-500" />
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
                href="/"
                className="block text-center p-2.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-250 rounded-xl text-[11px] font-bold text-neutral-600 transition-all"
              >
                Back to Dashboard Stats
              </Link>
            </div>
          </motion.div>

        </div>

      </div>
    </div>
  );
}

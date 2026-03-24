'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Upload, ChevronRight, Sparkles } from 'lucide-react';
import SearchInput from '../components/SearchInput';
import RecentResearch from '../components/RecentResearch';
import { getResearchHistory, startResearch } from '../lib/api';
import { ResearchHistoryItem } from '../types/research';

export default function Home() {
  const [history, setHistory] = useState<ResearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Generate simple session ID for this demo/beginner setup
    const storedId = localStorage.getItem('research_session_id');
    const newId = storedId || Math.random().toString(36).substring(2, 11);
    
    if (!storedId) {
      localStorage.setItem('research_session_id', newId);
    }
    setSessionId(newId);
    fetchHistory(newId);
  }, []);

  const fetchHistory = async (id: string) => {
    try {
      const data = await getResearchHistory(id);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  const handleSearch = async (query: string) => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      await startResearch(query, sessionId);
      // Wait a moment then refresh history (in real app, we follow the SSE stream)
      // For now, we just redirect or show a loading state
      // This part will be handled in Phase 39+ for result view
      console.log('Research started for:', query);
      // Let's manually add a "pending" entry for UX
      const newItem: ResearchHistoryItem = {
        session_id: sessionId + Date.now(),
        query,
        created_at: new Date().toISOString(),
        quality_score: null,
      };
      setHistory([newItem, ...history].slice(0, 5));
    } catch (err) {
      console.error('Failed to start research', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black font-sans selection:bg-blue-100 dark:selection:bg-blue-900/40 antialiased overflow-x-hidden">
      {/* Header / Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-black/70 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-default">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold group-hover:rotate-12 transition-transform">
              R
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              ResearchFlow
            </span>
          </div>
          <Link 
            href="/documents" 
            className="group flex items-center gap-2 px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-md"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Documents</span>
            <ChevronRight className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 pt-32 space-y-12">
        <div className="w-full max-w-4xl flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-full font-medium text-sm mb-4">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Research Engine</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.1]">
              Research made <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                effortless.
              </span>
            </h1>
          </div>

          <div className="w-full max-w-3xl">
            <SearchInput onSearch={handleSearch} isLoading={isLoading} />
          </div>

          {/* Social Proofish or help */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-zinc-400">
            <span>Popular:</span>
            <button key="ai" className="hover:text-blue-500 transition-colors">AI Agents</button>
            <span className="opacity-30">•</span>
            <button key="crypto" className="hover:text-blue-500 transition-colors">Blockchain Trends</button>
            <span className="opacity-30">•</span>
            <button key="tech" className="hover:text-blue-500 transition-colors">Quantum Computing</button>
          </div>
        </div>

        {/* History Section */}
        <div className="w-full max-w-4xl border-t border-zinc-200 dark:border-zinc-800 pt-16 mt-16 pb-24 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
          <RecentResearch history={history} />
        </div>
      </main>

      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-[60%] -right-[10%] w-[35%] h-[45%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>
    </div>
  );
}

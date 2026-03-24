'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Calendar, Trash2, Eye, ChevronRight } from 'lucide-react';
import { getAllResearchHistory, deleteSession } from '@/lib/api';
import { ResearchHistoryItem } from '@/types/research';

export default function HistoryPage() {
  const [history, setHistory] = useState<ResearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'quality'>('newest');
  const router = useRouter();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      // We'll use a placeholder 'research_session_id' for now as we don't have user auth
      const data = await getAllResearchHistory('research_session_id');
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Optimistic UI
    const originalHistory = [...history];
    setHistory(history.filter(item => item.session_id !== id));

    try {
      await deleteSession(id);
    } catch (err) {
      console.error('Failed to delete session:', err);
      setHistory(originalHistory); // Rollback
    }
  };

  // Filter and sort
  const filteredHistory = history
    .filter(item => item.query.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'quality') {
        const scoreA = a.quality_score ?? 0;
        const scoreB = b.quality_score ?? 0;
        return scoreB - scoreA;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const getScoreColor = (score: number | undefined) => {
    if (score === undefined) return 'bg-gray-500/10 text-gray-400';
    if (score >= 8) return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
    if (score >= 6) return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diff < 7 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-indigo-500/30">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full -z-10" />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Research History</h1>
            </div>
            <p className="text-gray-400 text-lg">
              Revisit and manage your past AI-driven investigations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 w-full sm:w-64 transition-all"
              />
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="quality">Highest Score</option>
            </select>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-white/5 rounded-3xl border border-white/10" />
            ))}
          </div>
        ) : filteredHistory.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHistory.map((item) => (
              <div 
                key={item.session_id}
                className="group relative bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-500 cursor-pointer overflow-hidden"
                onClick={() => router.push(`/research/${item.session_id}`)}
              >
                {/* Decorative Gradient Flare */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10 transition-colors" />

                <div className="flex justify-between items-start mb-6">
                  <div className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider ${getScoreColor(item.quality_score ?? undefined)}`}>
                    {item.quality_score ? `Score ${item.quality_score}/10` : 'No Score'}
                  </div>
                  <button 
                    onClick={(e) => handleDelete(e, item.session_id)}
                    className="p-2 text-gray-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-xl font-semibold mb-3 leading-tight group-hover:text-indigo-300 transition-colors line-clamp-3">
                  {item.query}
                </h3>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    {formatDate(item.created_at)}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-medium text-indigo-400 group-hover:translate-x-1 transition-transform">
                    View Report <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
            <div className="bg-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Eye className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No Research Found</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              You haven&apos;t conducted any research tasks yet. Head back home to start your first investigation.
            </p>
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black font-semibold rounded-2xl hover:bg-gray-200 transition-all"
            >
              Start Research
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

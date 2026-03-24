'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Calendar, Trash2, Eye, ChevronRight, ArrowLeft } from 'lucide-react';
import { getAllResearchHistory, deleteSession } from '../../lib/api';
import { ResearchHistoryItem } from '../../types/research';

export default function HistoryPage() {
  const [history, setHistory] = useState<ResearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'quality'>('newest');
  const router = useRouter();

  useEffect(() => {
    const sessionId = localStorage.getItem('research_session_id') || '';
    getAllResearchHistory(sessionId)
      .then((data) => { setHistory(data); setLoading(false); })
      .catch((err) => { console.error('Failed to fetch history:', err); setLoading(false); });
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const original = [...history];
    setHistory((h) => h.filter((item) => item.session_id !== id));
    try {
      await deleteSession(id);
    } catch {
      setHistory(original);
    }
  };

  const filtered = history
    .filter((item) => item.query.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'quality') return ((b.quality_score ?? 0) - (a.quality_score ?? 0));
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const scoreChip = (score: number | null) => {
    if (score === null) return 'bg-zinc-100 text-zinc-500';
    if (score >= 8) return 'bg-green-100 text-green-700';
    if (score >= 6) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };


  return (
    <div className="min-h-screen bg-white pt-16">
      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors">
              <ArrowLeft className="w-4 h-4 text-zinc-500" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Research History</h1>
              <p className="text-sm text-zinc-500">Revisit your past AI-driven research sessions</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-zinc-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all w-48"
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'quality')}
              className="px-3 py-2 border border-zinc-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-white cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="quality">Highest Score</option>
            </select>
          </div>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-44 bg-zinc-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((item) => (
              <div
                key={item.session_id}
                onClick={() => router.push(`/research/${item.session_id}`)}
                className="group relative bg-white border border-zinc-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between gap-4"
              >
                {/* Score + Delete */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${scoreChip(item.quality_score)}`}>
                    {item.quality_score !== null ? `Score ${item.quality_score}/10` : 'Pending'}
                  </span>
                  <button
                    onClick={(e) => handleDelete(e, item.session_id)}
                    className="p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Query */}
                <p className="text-sm font-medium text-zinc-800 line-clamp-3 leading-relaxed group-hover:text-blue-600 transition-colors">
                  {item.query}
                </p>

                {/* Date + Link */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <span className="text-xs font-medium text-blue-500 flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                    View Report <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-24 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Eye className="w-7 h-7 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-700 mb-2">
              {searchTerm ? 'No matching results' : 'No research yet'}
            </h3>
            <p className="text-sm text-zinc-400 mb-6">
              {searchTerm ? 'Try a different search term.' : 'Start researching from the home page.'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Start Research
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

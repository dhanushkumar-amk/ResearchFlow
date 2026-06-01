'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  ArrowRight, 
  Clock, 
  FileText, 
  Upload, 
  Search, 
  Database, 
  Award, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle, 
  Activity, 
  ChevronRight,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import { getAllResearchHistory, startResearch, getHistory } from '../lib/api';
import { ResearchHistoryItem, Document } from '../types/research';
import { useAuth } from '../lib/AuthContext';
import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  BarChart, 
  Bar, 
  Cell
} from 'recharts';

export default function Dashboard() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<ResearchHistoryItem[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!token) return;
    
    // Fetch research history
    getAllResearchHistory(token)
      .then(setHistory)
      .catch((err) => console.error('Failed to fetch history', err));

    // Fetch document library
    getHistory(token)
      .then(setDocuments)
      .catch((err) => console.error('Failed to fetch documents', err));
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
    'AI Agents in 2026', 
    'Quantum Computing advances', 
    'Blockchain in healthcare', 
    'Climate tech startups'
  ];

  // --- Statistics Calculations ---
  const totalQueries = history.length;
  const successfulQueries = history.filter(
    (item) => item.status === 'complete' || (item.quality_score !== null && item.quality_score > 0)
  ).length;
  const successRate = totalQueries > 0 ? Math.round((successfulQueries / totalQueries) * 100) : 0;

  const scoredItems = history.filter((item) => item.quality_score !== null);
  const avgQuality = scoredItems.length > 0
    ? (scoredItems.reduce((acc, item) => acc + (item.quality_score || 0), 0) / scoredItems.length).toFixed(1)
    : 'N/A';

  const documentCount = documents.length;

  // --- Recharts Data Preparation ---
  const getActivityData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const counts: Record<string, number> = {};
    last7Days.forEach(date => {
      counts[date] = 0;
    });

    history.forEach(item => {
      const dateStr = new Date(item.created_at).toISOString().split('T')[0];
      if (dateStr in counts) {
        counts[dateStr]++;
      }
    });

    return last7Days.map(date => {
      const dateObj = new Date(date);
      return {
        date: dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        queries: counts[date],
      };
    });
  };

  const getQualityDistributionData = () => {
    let excellent = 0; // 8-10
    let good = 0;      // 6-7
    let average = 0;   // 4-5
    let poor = 0;      // <4

    history.forEach(item => {
      if (item.quality_score !== null) {
        if (item.quality_score >= 8) excellent++;
        else if (item.quality_score >= 6) good++;
        else if (item.quality_score >= 4) average++;
        else poor++;
      }
    });

    return [
      { name: 'Excellent (8-10)', value: excellent, color: '#10b981' },
      { name: 'Good (6-7)', value: good, color: '#3b82f6' },
      { name: 'Average (4-5)', value: average, color: '#f59e0b' },
      { name: 'Poor (<4)', value: poor, color: '#ef4444' },
    ];
  };

  // Custom tooltips to keep matching styles
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-800 text-white px-3 py-2 rounded-xl text-xs shadow-lg">
          <p className="font-semibold text-zinc-300">{label}</p>
          <p className="text-emerald-400 mt-1 font-bold">Queries: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const QualityTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-800 text-white px-3 py-2 rounded-xl text-xs shadow-lg">
          <p className="font-semibold text-zinc-300">{payload[0].name}</p>
          <p className="text-indigo-400 mt-1 font-bold">Reports: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  // Stagger animation rules
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  } as const;

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100 } }
  } as const;

  return (
    <div className="min-h-screen bg-zinc-50/50 pt-20 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Subtle Glow Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.06),rgba(255,255,255,0))] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-10 relative">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-100 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Intelligence Dashboard Active
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              Welcome Back, {user?.name.split(' ')[0] || 'Researcher'}
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Start new sessions, monitor quality achievements, and view RAG corpus data.
            </p>
          </div>
          
          <div className="text-xs text-zinc-400 font-medium md:text-right bg-white px-4 py-2 border border-zinc-200 rounded-xl shadow-sm self-start">
            <span className="text-zinc-500 font-semibold block">Active Session Token</span>
            Logged in securely
          </div>
        </div>

        {/* SEARCH LAUNCHER PANEL */}
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-zinc-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-zinc-100 relative overflow-hidden"
        >
          <div className="max-w-3xl mx-auto space-y-6 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-zinc-900">Launch New Deep Research</h2>
              <p className="text-zinc-500 text-sm">
                Ask a research question. Our multi-agent workflow crawls the web, checks internal documents, and outputs an evaluated report.
              </p>
            </div>

            <form onSubmit={handleSearch} className="relative w-full group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-emerald-500 transition-colors">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What topic or question do you want to explore?"
                className="w-full pl-12 pr-36 py-4.5 text-base border border-zinc-200 rounded-2xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 bg-zinc-50/30 focus:bg-white shadow-inner transition-all placeholder-zinc-400 text-zinc-900"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-semibold rounded-xl transition-all active:scale-95 shadow-md hover:shadow-emerald-500/10 cursor-pointer text-sm"
              >
                {isLoading ? (
                  <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <>Research <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm text-left flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Suggestions */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-zinc-400 font-medium">Quick Ideas:</span>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="px-3 py-1.5 bg-zinc-100 hover:bg-emerald-50 text-zinc-600 hover:text-emerald-700 border border-zinc-200 hover:border-emerald-200 rounded-lg font-medium transition-all cursor-pointer"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* STATISTICS GRID */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* STAT 1: TOTAL QUERIES */}
          <motion.div variants={cardVariants} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">Total Queries</span>
                <span className="text-3xl font-extrabold text-zinc-950">{totalQueries}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 group-hover:scale-110 transition-transform">
                <Search className="w-5 h-5" />
              </div>
            </div>
            <div className="text-xs text-zinc-500 mt-3.5 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              All-time research runs logged
            </div>
          </motion.div>

          {/* STAT 2: SUCCESS RATE */}
          <motion.div variants={cardVariants} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">Success Rate</span>
                <span className="text-3xl font-extrabold text-zinc-950">{successRate}%</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3.5">
              <div className="w-full bg-zinc-100 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${successRate}%` }} />
              </div>
            </div>
          </motion.div>

          {/* STAT 3: QUALITY ACHIEVEMENT */}
          <motion.div variants={cardVariants} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">Avg Quality Score</span>
                <span className="text-3xl font-extrabold text-zinc-950">
                  {avgQuality}
                  {avgQuality !== 'N/A' && <span className="text-sm font-semibold text-zinc-400 ml-1">/10</span>}
                </span>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 group-hover:scale-110 transition-transform">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="text-xs text-zinc-500 mt-3.5 flex items-center gap-1.5">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                avgQuality === 'N/A' ? 'bg-zinc-300' :
                parseFloat(avgQuality) >= 8 ? 'bg-emerald-500' :
                parseFloat(avgQuality) >= 6 ? 'bg-blue-500' : 'bg-amber-500'
              }`} />
              {avgQuality === 'N/A' ? 'No reports scored yet' : 
               parseFloat(avgQuality) >= 8 ? 'Expert Level Reports' : 
               parseFloat(avgQuality) >= 6 ? 'Professional Grade' : 'Averaging Competent'}
            </div>
          </motion.div>

          {/* STAT 4: CORPUS DOCUMENTS */}
          <motion.div variants={cardVariants} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">RAG Corpus Files</span>
                <span className="text-3xl font-extrabold text-zinc-950">{documentCount}</span>
              </div>
              <div className="p-3 bg-violet-50 rounded-xl text-violet-600 group-hover:scale-110 transition-transform">
                <Database className="w-5 h-5" />
              </div>
            </div>
            <div className="text-xs text-zinc-500 mt-3.5 flex items-center justify-between">
              <span>Grounding source documents</span>
              <Link href="/documents" className="text-emerald-600 font-semibold hover:underline flex items-center">
                Manage <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </motion.div>
        </motion.div>

        {/* ANALYTICS VISUALIZATIONS */}
        {isMounted && history.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CHART 1: WEEKLY ACTIVITY */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-500" /> Research Frequency (Last 7 Days)
                </h3>
                <p className="text-xs text-zinc-400">Daily breakdown of launched AI queries</p>
              </div>
              <div className="h-[240px] w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getActivityData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#94a3b8" />
                    <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" allowDecimals={false} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="queries" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorQueries)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART 2: QUALITY DISTRIBUTION */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-500" /> Quality Grade Distribution
                </h3>
                <p className="text-xs text-zinc-400">Evaluations of reports generated by Critic agent</p>
              </div>
              <div className="h-[240px] w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getQualityDistributionData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#94a3b8" />
                    <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" allowDecimals={false} />
                    <RechartsTooltip content={<QualityTooltip />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                      {getQualityDistributionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* BOTTOM SECTION: RECENT SESSIONS & TIPS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* RECENT SESSIONS TABLE/LIST */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" /> Recent Research Operations
                </h3>
                <p className="text-xs text-zinc-400">Jump back into your active or completed reports</p>
              </div>
              <Link href="/history" className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-0.5">
                View History <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {history.length > 0 ? (
              <div className="space-y-2.5">
                {history.slice(0, 5).map((item) => (
                  <Link
                    key={item.session_id}
                    href={`/research/${item.session_id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-zinc-50/50 hover:bg-emerald-50/30 border border-zinc-200/70 hover:border-emerald-200 rounded-xl transition-all group gap-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-white border border-zinc-200 rounded-lg flex items-center justify-center shrink-0 shadow-sm group-hover:border-emerald-250 transition-colors">
                        <FileText className="w-4.5 h-4.5 text-zinc-550 group-hover:text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-zinc-800 truncate block group-hover:text-emerald-700 transition-colors">
                          {item.query}
                        </span>
                        <span className="text-[11px] text-zinc-400 block mt-0.5">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      {/* Quality Score */}
                      {item.quality_score !== null ? (
                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            item.quality_score >= 8 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            item.quality_score >= 6 ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            Score: {item.quality_score}/10
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] bg-zinc-100 text-zinc-500 border border-zinc-200 px-2 py-0.5 rounded-full font-medium">
                          No Score
                        </span>
                      )}

                      {/* Status */}
                      {item.status && (
                        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-md ${
                          item.status === 'complete' ? 'bg-emerald-100 text-emerald-800' :
                          item.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                      )}

                      <ChevronRight className="w-4 h-4 text-zinc-350 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all hidden sm:block" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 border border-dashed border-zinc-200 rounded-2xl text-center space-y-4">
                <Upload className="w-10 h-10 mx-auto text-zinc-300" />
                <div className="max-w-sm mx-auto space-y-1">
                  <p className="font-semibold text-zinc-700 text-sm">No research sessions active</p>
                  <p className="text-zinc-400 text-xs">Run a query in the launcher to spin up AI agents or link custom document parameters.</p>
                </div>
                <Link href="/documents" className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline">
                  Go to documents <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* SIDEBAR: HELP / DOCUMENT QUICK ACTIONS */}
          <div className="space-y-6">
            
            {/* KNOWLEDGE BASE CARD */}
            <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-zinc-900 text-sm flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-violet-500" /> Research Grounding
                </h3>
                <p className="text-xs text-zinc-400">Augment intelligence with local libraries</p>
              </div>
              
              <div className="p-3.5 bg-zinc-50 border border-zinc-150 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium">Index Status</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> Active
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium">Total Vectors</span>
                  <span className="text-zinc-700 font-semibold">{documentCount > 0 ? `${documentCount * 8} chunks` : '0 Chunks'}</span>
                </div>
              </div>

              <Link href="/documents" className="flex items-center justify-between p-3 border border-dashed border-zinc-250 hover:border-emerald-400 hover:bg-emerald-50/10 rounded-xl text-xs font-semibold text-zinc-650 hover:text-emerald-700 transition-colors">
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-zinc-450" /> Add PDFs / Docs
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* QUICK TIP CARD */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white rounded-2xl p-5 shadow-md relative overflow-hidden group">
              <div className="absolute right-[-20px] bottom-[-20px] opacity-10 group-hover:scale-120 transition-transform">
                <Sparkles className="w-32 h-32 text-white" />
              </div>
              <div className="space-y-3.5 relative">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-emerald-400">
                  <HelpCircle className="w-4.5 h-4.5" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm">Did you know?</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    ResearchFlow caches search queries for 24 hours. Repeating queries uses instant cached outputs, saving API tokens and research cycles.
                  </p>
                </div>
                <div className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
                  Agent Network 2.0 Enabled
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

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
import { getAllResearchHistory, getHistory } from '../lib/api';
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
  const [history, setHistory] = useState<ResearchHistoryItem[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
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

  // Custom tooltips to match soft style
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-neutral-200 text-[#0a0a0a] px-3.5 py-2.5 rounded-xl text-xs shadow-[0_8px_30px_rgba(0,0,0,0.06)] font-sans">
          <p className="font-bold text-neutral-800">{label}</p>
          <p className="text-emerald-600 mt-1 font-bold">Queries: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const QualityTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-neutral-200 text-[#0a0a0a] px-3.5 py-2.5 rounded-xl text-xs shadow-[0_8px_30px_rgba(0,0,0,0.06)] font-sans">
          <p className="font-bold text-neutral-800">{payload[0].name}</p>
          <p className="text-indigo-650 mt-1 font-bold">Reports: {payload[0].value}</p>
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
    <div className="min-h-screen bg-white text-[#0a0a0a] pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans antialiased selection:bg-emerald-50 selection:text-emerald-700">
      
      {/* Background Decorative Soft Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/[0.02] rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute top-[400px] right-1/4 w-[500px] h-[500px] bg-teal-500/[0.01] rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.25] pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3.5 py-1.2 rounded-full text-[10px] font-mono border border-emerald-100/70 font-semibold mb-3 shadow-xs select-none">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Deep Research Management Portal</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 leading-none">
              Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">{user?.name.split(' ')[0] || 'Researcher'}</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-2">
              Review research metrics, monitor quality evaluations, and start new queries.
            </p>
          </div>
          
          <div className="text-xs text-neutral-400 font-medium md:text-right bg-[#f9fafb] border border-neutral-200/80 px-4 py-2.5 rounded-xl self-start shadow-xs">
            <span className="text-neutral-500 font-bold block mb-0.5">Index Sync Status</span>
            RAG database connection online
          </div>
        </div>

        {/* START RESEARCH CTA BANNER */}
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden"
        >
          <div className="absolute right-[-40px] top-[-40px] opacity-[0.03] pointer-events-none">
            <Sparkles className="w-48 h-48 text-emerald-600 animate-pulse" />
          </div>
          <div className="space-y-2 text-left max-w-xl relative z-10">
            <h2 className="text-xl font-bold text-zinc-900">Conduct Deep Investigative Research</h2>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Launch a new research session. Our multi-agent workspace compiles search logs, aggregates Qdrant database vectors, and synthesizes grounded reports.
            </p>
          </div>
          <Link
            href="/research"
            className="bg-[#0a0a0a] hover:bg-[#262626] text-white px-6 py-3 rounded-[8px] font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-sm"
          >
            Start Research
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* STATISTICS GRID */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* STAT 1: TOTAL QUERIES */}
          <motion.div variants={cardVariants} className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono block">Total Queries</span>
                <span className="text-3xl font-extrabold text-neutral-900">{totalQueries}</span>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
                <Search className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[11px] text-neutral-400 mt-4 flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
              All-time research runs logged
            </div>
          </motion.div>

          {/* STAT 2: SUCCESS RATE */}
          <motion.div variants={cardVariants} className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono block">Success Rate</span>
                <span className="text-3xl font-extrabold text-neutral-900">{successRate}%</span>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4.5">
              <div className="w-full bg-neutral-100 rounded-full h-1">
                <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${successRate}%` }} />
              </div>
            </div>
          </motion.div>

          {/* STAT 3: QUALITY ACHIEVEMENT */}
          <motion.div variants={cardVariants} className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono block">Avg Quality Score</span>
                <span className="text-3xl font-extrabold text-neutral-900">
                  {avgQuality}
                  {avgQuality !== 'N/A' && <span className="text-xs font-semibold text-neutral-400 ml-0.5">/10</span>}
                </span>
              </div>
              <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[11px] text-neutral-400 mt-4 flex items-center gap-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${
                avgQuality === 'N/A' ? 'bg-neutral-300' :
                parseFloat(avgQuality) >= 8 ? 'bg-emerald-500' :
                parseFloat(avgQuality) >= 6 ? 'bg-blue-500' : 'bg-amber-500'
              }`} />
              {avgQuality === 'N/A' ? 'No reports scored yet' : 
               parseFloat(avgQuality) >= 8 ? 'Expert Level Reports' : 
               parseFloat(avgQuality) >= 6 ? 'Professional Grade' : 'Averaging Competent'}
            </div>
          </motion.div>

          {/* STAT 4: CORPUS DOCUMENTS */}
          <motion.div variants={cardVariants} className="bg-white border border-neutral-200/80 rounded-xl p-5 shadow-xs hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono block">RAG Corpus Files</span>
                <span className="text-3xl font-extrabold text-neutral-900">{documentCount}</span>
              </div>
              <div className="p-2.5 bg-violet-50 rounded-lg text-violet-600">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div className="text-[11px] text-neutral-400 mt-4 flex items-center justify-between">
              <span>Grounding source files</span>
              <Link href="/documents" className="text-emerald-600 font-bold hover:underline flex items-center">
                Manage <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        </motion.div>

        {/* ANALYTICS VISUALIZATIONS */}
        {isMounted && history.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CHART 1: WEEKLY ACTIVITY */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-neutral-800 text-sm flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-500" /> Research Frequency (Last 7 Days)
                </h3>
                <p className="text-[11px] text-neutral-400">Daily breakdown of launched AI queries</p>
              </div>
              <div className="h-[240px] w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getActivityData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.12}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#a3a3a3" />
                    <YAxis tickLine={false} axisLine={false} stroke="#a3a3a3" allowDecimals={false} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="queries" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorQueries)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHART 2: QUALITY DISTRIBUTION */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-neutral-800 text-sm flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-indigo-500" /> Quality Grade Distribution
                </h3>
                <p className="text-[11px] text-neutral-400">Evaluations of reports generated by Critic agent</p>
              </div>
              <div className="h-[240px] w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getQualityDistributionData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#a3a3a3" />
                    <YAxis tickLine={false} axisLine={false} stroke="#a3a3a3" allowDecimals={false} />
                    <RechartsTooltip content={<QualityTooltip />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={36}>
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
          
          {/* RECENT SESSIONS LIST */}
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-neutral-800 text-sm flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" /> Recent Research Operations
                </h3>
                <p className="text-[11px] text-neutral-400">Jump back into your active or completed reports</p>
              </div>
              <Link href="/history" className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-0.5">
                View History <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {history.length > 0 ? (
              <div className="space-y-2.5">
                {history.slice(0, 5).map((item) => (
                  <Link
                    key={item.session_id}
                    href={`/research/${item.session_id}`}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-neutral-50/20 hover:bg-emerald-50/[0.05] border border-neutral-200/60 hover:border-emerald-500/20 rounded-xl transition-all group gap-2.5 hover:shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-white border border-neutral-100 rounded-lg flex items-center justify-center shrink-0 shadow-xs group-hover:border-emerald-500/30 transition-colors">
                        <FileText className="w-4.5 h-4.5 text-neutral-400 group-hover:text-emerald-500" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[#0a0a0a] truncate block group-hover:text-emerald-700 transition-colors">
                          {item.query}
                        </span>
                        <span className="text-[10px] text-neutral-400 block mt-0.5">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      {/* Quality Score */}
                      {item.quality_score !== null ? (
                        <div className="flex items-center gap-1">
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            item.quality_score >= 8 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/70' :
                            item.quality_score >= 6 ? 'bg-blue-50 text-blue-700 border border-blue-100/70' :
                            'bg-amber-50 text-amber-700 border border-amber-100/70'
                          }`}>
                            Score: {item.quality_score}/10
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] font-mono bg-neutral-50 text-neutral-450 border border-neutral-150 px-2 py-0.5 rounded-full font-bold">
                          No Score
                        </span>
                      )}

                      {/* Status */}
                      {item.status && (
                        <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                          item.status === 'complete' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/70' :
                          item.status === 'failed' ? 'bg-red-50 text-red-700 border border-red-100/70' :
                          'bg-amber-50 text-amber-700 border border-amber-100/70'
                        }`}>
                          {item.status.toUpperCase()}
                        </span>
                      )}

                      <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all hidden sm:block" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-8 border border-dashed border-neutral-200 rounded-xl text-center space-y-4">
                <Upload className="w-10 h-10 mx-auto text-zinc-300" />
                <div className="max-w-sm mx-auto space-y-1">
                  <p className="font-semibold text-zinc-700 text-sm">No research sessions active</p>
                  <p className="text-zinc-400 text-xs">Run a query in the launcher to spin up AI agents or link custom document parameters.</p>
                </div>
                <Link href="/documents" className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline">
                  Go to documents <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* SIDEBAR: HELP / DOCUMENT QUICK ACTIONS */}
          <div className="space-y-6">
            
            {/* KNOWLEDGE BASE CARD */}
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-4">
              <div>
                <h3 className="font-bold text-neutral-800 text-sm flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-violet-500" /> Research Grounding
                </h3>
                <p className="text-[11px] text-neutral-400">Augment intelligence with local libraries</p>
              </div>
              
              <div className="p-3.5 bg-[#f9fafb] border border-neutral-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500 font-medium">Index Status</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> Active
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500 font-medium">Total Vectors</span>
                  <span className="text-neutral-800 font-bold">{documentCount > 0 ? `${documentCount * 8} chunks` : '0 Chunks'}</span>
                </div>
              </div>

              <Link href="/documents" className="flex items-center justify-between p-3 border border-dashed border-neutral-250 hover:border-emerald-400 hover:bg-emerald-50/[0.03] rounded-xl text-xs font-semibold text-neutral-650 hover:text-emerald-700 transition-colors">
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-neutral-400" /> Add PDFs / Docs
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* QUICK TIP CARD */}
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.05] pointer-events-none group-hover:scale-110 transition-transform">
                <Sparkles className="w-32 h-32 text-white" />
              </div>
              <div className="space-y-3.5 relative">
                <div className="w-7 h-7 rounded bg-white/10 flex items-center justify-center text-emerald-400">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-xs">Smart Query Routing</h4>
                  <p className="text-[11px] text-neutral-400 leading-relaxed">
                    ResearchFlow caches search queries for 24 hours. Repeating queries uses instant cached outputs, saving API tokens and research cycles.
                  </p>
                </div>
                <div className="text-[9px] font-mono text-emerald-400 font-bold tracking-wider uppercase">
                  Agent Network 2.0 Active
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

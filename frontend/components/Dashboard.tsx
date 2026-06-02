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
  Activity,
  ChevronRight,
  BookOpen,
  HelpCircle,
  CheckCircle,
  AlertCircle
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
  Cell,
  PieChart,
  Pie,
  Legend
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

  const getStatusPieData = () => {
    let complete = 0;
    let failed = 0;
    let pending = 0;

    history.forEach(item => {
      if (item.status === 'complete') complete++;
      else if (item.status === 'failed') failed++;
      else pending++;
    });

    if (history.length === 0) {
      return [
        { name: 'Completed', value: 1, color: '#10b981' },
        { name: 'Failed', value: 0, color: '#ef4444' },
        { name: 'Pending', value: 0, color: '#f59e0b' },
      ];
    }

    return [
      { name: 'Completed', value: complete, color: '#10b981' },
      { name: 'Failed', value: failed, color: '#ef4444' },
      { name: 'Pending', value: pending, color: '#f59e0b' },
    ];
  };

  // Custom tooltips to match soft style
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-neutral-200 text-[#0a0a0a] px-3 py-2 rounded-lg text-[11px] shadow-xs font-sans">
          <p className="font-semibold text-neutral-800">{label}</p>
          <p className="text-emerald-600 mt-0.5 font-bold">Queries: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const QualityTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-neutral-200 text-[#0a0a0a] px-3 py-2 rounded-lg text-[11px] shadow-xs font-sans">
          <p className="font-semibold text-neutral-800">{payload[0].name}</p>
          <p className="text-indigo-600 mt-0.5 font-bold">Reports: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans antialiased selection:bg-emerald-50 selection:text-emerald-700">

      {/* Background Decorative Soft Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/[0.015] rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.25] pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-5">
          <div className="space-y-1.5 text-left">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3.5 py-1 rounded-full text-[10px] font-mono border border-emerald-100/70 font-semibold shadow-xs select-none">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
              <span>Multi-Agent Research Portal</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 leading-none">
              Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">{user?.name.split(' ')[0] || 'Researcher'}</span>
            </h1>
            <p className="text-neutral-500 text-xs">
              Review research metrics, monitor quality evaluations, and start new queries.
            </p>
          </div>
        </div>

        {/* 2-COLUMN PREMIUM WORKSPACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: PRIMARY WORKSPACE & VOLUME TRENDS (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">

            {/* START RESEARCH CTA BANNER */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-neutral-200/70 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs relative overflow-hidden"
            >
              <div className="space-y-1 text-left max-w-lg">
                <h2 className="text-base font-extrabold text-zinc-900">Conduct Deep Investigative Research</h2>
                <p className="text-neutral-500 text-[11px] leading-relaxed">
                  Launch a new research session. Our multi-agent workspace compiles search logs, aggregates Qdrant database vectors, and synthesizes grounded reports.
                </p>
              </div>
              <Link
                href="/research"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-[8px] font-bold text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-[0_4px_14px_rgba(16,185,129,0.2)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.3)]"
              >
                Start Research
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </motion.div>

            {/* CHART 1: WEEKLY ACTIVITY */}
            {isMounted && history.length > 0 && (
              <div className="bg-white border border-neutral-200/70 rounded-xl p-5 shadow-2xs space-y-4 text-left">
                <div>
                  <h3 className="font-bold text-neutral-800 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" /> Research Frequency (Last 7 Days)
                  </h3>
                  <p className="text-[10px] text-neutral-400">Daily breakdown of launched queries</p>
                </div>
                <div className="h-[240px] w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getActivityData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
            )}

            {/* RECENT SESSIONS LIST */}
            <div className="bg-white border border-neutral-200/70 rounded-xl p-5 shadow-2xs space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-neutral-800 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-650" /> Recent Research Operations
                  </h3>
                  <p className="text-[10px] text-neutral-400">Jump back into your active or completed reports</p>
                </div>
                <Link href="/history" className="text-xs font-semibold text-emerald-650 hover:underline flex items-center gap-0.5">
                  View History <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {history.length > 0 ? (
                <div className="border border-zinc-100 rounded-xl overflow-hidden divide-y divide-zinc-100 bg-white">
                  {history.slice(0, 5).map((item) => (
                    <Link
                      key={item.session_id}
                      href={`/research/${item.session_id}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 hover:bg-zinc-50/50 transition-all group gap-2.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-zinc-50 border border-zinc-100 rounded-lg flex items-center justify-center shrink-0 group-hover:border-emerald-500/10 transition-colors shadow-2xs">
                          <FileText className="w-4 h-4 text-neutral-450 group-hover:text-emerald-500" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[#0a0a0a] truncate block group-hover:text-emerald-700 transition-colors">
                            {item.query}
                          </span>
                          <span className="text-[9px] text-neutral-400 block mt-0.5 font-medium">
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        {item.quality_score !== null ? (
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${item.quality_score >= 8 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' :
                              item.quality_score >= 6 ? 'bg-blue-50 text-blue-700 border border-blue-100/50' :
                                'bg-amber-50 text-amber-700 border border-amber-100/50'
                            }`}>
                            Score: {item.quality_score}/10
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono bg-neutral-50 text-neutral-455 border border-neutral-100 px-2 py-0.5 rounded-full font-bold">
                            No Score
                          </span>
                        )}

                        {item.status && (
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${item.status === 'complete' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' :
                              item.status === 'failed' ? 'bg-red-50 text-red-700 border border-red-100/50' :
                                'bg-amber-50 text-amber-700 border border-amber-100/50'
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

          </div>

          {/* RIGHT COLUMN: ANALYTICS SIDEBAR (1/3 width) */}
          <div className="space-y-6">

            {/* COMPACT METRICS GRID */}
            <div className="grid grid-cols-2 gap-4">

              {/* METRIC 1: TOTAL QUERIES */}
              <div className="bg-white border border-neutral-200/70 rounded-xl p-4.5 text-left shadow-2xs">
                <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 font-mono block">Total Runs</span>
                <span className="text-2xl font-black text-neutral-900 block mt-1">{totalQueries}</span>
                <span className="text-[9px] text-neutral-400 mt-2 block">All-time operations</span>
              </div>

              {/* METRIC 2: SUCCESS RATE */}
              <div className="bg-white border border-neutral-200/70 rounded-xl p-4.5 text-left shadow-2xs">
                <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 font-mono block">Success</span>
                <span className="text-2xl font-black text-neutral-900 block mt-1">{successRate}%</span>
                <div className="w-full bg-neutral-100 rounded-full h-1 mt-2.5">
                  <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${successRate}%` }} />
                </div>
              </div>

              {/* METRIC 3: AVG QUALITY */}
              <div className="bg-white border border-neutral-200/70 rounded-xl p-4.5 text-left shadow-2xs">
                <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 font-mono block">Avg Quality</span>
                <span className="text-2xl font-black text-neutral-900 block mt-1">
                  {avgQuality}
                  {avgQuality !== 'N/A' && <span className="text-xs font-normal text-neutral-450 ml-0.5">/10</span>}
                </span>
                <span className="text-[9px] text-neutral-400 mt-2 block">Critic evaluated</span>
              </div>

              {/* METRIC 4: DOCUMENT COUNT */}
              <div className="bg-white border border-neutral-200/70 rounded-xl p-4.5 text-left shadow-2xs">
                <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 font-mono block">Corpus Files</span>
                <span className="text-2xl font-black text-neutral-900 block mt-1">{documentCount}</span>
                <Link href="/documents" className="text-[9px] text-emerald-650 hover:underline mt-2 block font-semibold">
                  Manage Files &gt;
                </Link>
              </div>

            </div>

            {/* CHART 2: EXECUTION HEALTH STATUS */}
            {isMounted && history.length > 0 && (
              <div className="bg-white border border-neutral-200/70 rounded-xl p-4.5 shadow-2xs space-y-3 text-left">
                <div>
                  <h4 className="font-bold text-neutral-800 text-[10px] uppercase tracking-wider font-mono">Query Execution status</h4>
                  <p className="text-[9px] text-neutral-450">Real-time status of database query sessions</p>
                </div>
                <div className="h-[140px] w-full flex justify-center items-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getStatusPieData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {getStatusPieData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Legend verticalAlign="bottom" height={24} iconSize={6} wrapperStyle={{ fontSize: '9px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* CHART 3: REPORT QUALITY SCORING */}
            {isMounted && history.length > 0 && (
              <div className="bg-white border border-neutral-200/70 rounded-xl p-4.5 shadow-2xs space-y-3 text-left">
                <div>
                  <h4 className="font-bold text-neutral-800 text-[10px] uppercase tracking-wider font-mono">Critic Quality Breakdown</h4>
                  <p className="text-[9px] text-neutral-455">Quantity count by rating category</p>
                </div>
                <div className="h-[140px] w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getQualityDistributionData()} margin={{ top: 5, right: 5, left: -32, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#a3a3a3" style={{ fontSize: '7px' }} />
                      <YAxis tickLine={false} axisLine={false} stroke="#a3a3a3" allowDecimals={false} style={{ fontSize: '8px' }} />
                      <RechartsTooltip content={<QualityTooltip />} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={20}>
                        {getQualityDistributionData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* KNOWLEDGE BASE GROUNDING PANEL */}
            <div className="bg-white border border-neutral-200/70 rounded-xl p-5 shadow-2xs space-y-4 text-left">
              <div>
                <h3 className="font-bold text-neutral-850 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-violet-500" /> Research Grounding
                </h3>
                <p className="text-[10px] text-neutral-450">Augment intelligence with local libraries</p>
              </div>

              <div className="p-3 bg-[#f9fafb] border border-neutral-200 rounded-lg space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 font-medium">Index Status</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> Active
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 font-medium">Total Chunks</span>
                  <span className="text-neutral-800 font-bold">{documentCount > 0 ? `${documentCount * 8} vectors` : '0 Vectors'}</span>
                </div>
              </div>

              <Link href="/documents" className="flex items-center justify-between p-3 border border-dashed border-neutral-200 hover:border-emerald-400 hover:bg-emerald-50/[0.02] rounded-lg text-xs font-semibold text-neutral-650 hover:text-emerald-700 transition-colors">
                <span className="flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-neutral-450" /> Add Grounding Files
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

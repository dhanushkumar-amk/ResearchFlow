'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Calendar, Award, Sparkles, 
  Globe, Lock, Copy, Check, Download, 
  Share2, FileText, FileCode, CheckCircle2 
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import StreamingReport from '../../../../components/StreamingReport';
import { getSessionDetails } from '../../../../lib/api';
import { useAuth } from '../../../../lib/AuthContext';
import { exportToPDF, exportToDOCX, exportToJSON } from '../../../../lib/exportUtils';

interface ReportDetails {
  query: string;
  content: string;
  report?: string;
  quality_score: number | null;
  duration_seconds: number | null;
  is_public: boolean;
  created_at: string;
}

export default function FocusedReportView() {
  const { sessionId } = useParams() as { sessionId: string };
  const { token } = useAuth();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [reportData, setReportData] = useState<ReportDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  // Sharing & Export States
  const [copied, setCopied] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const fetchReport = async (authToken: string) => {
    try {
      setLoading(true);
      const data = await getSessionDetails(sessionId, authToken);
      const content = data.report || data.content;
      if (!content) {
        throw new Error('Report content is still generating or not found.');
      }
      setReportData({
        query: data.query,
        content: content,
        quality_score: data.quality_score ?? null,
        duration_seconds: data.duration_seconds ?? null,
        is_public: !!data.is_public,
        created_at: data.created_at,
      });
      setIsPublic(!!data.is_public);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load report:', err);
      setError(err.message || 'Failed to fetch report details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && sessionId) {
      fetchReport(token);
    }
  }, [sessionId, token]);

  // Click outside to close export dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTogglePublic = async (val: boolean) => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/research/${sessionId}/public`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isPublic: val })
      });
      if (response.ok) {
        setIsPublic(val);
      }
    } catch (err) {
      console.error('Failed to toggle public status:', err);
    }
  };

  const handleCopy = async () => {
    if (!reportData) return;
    try {
      if (isPublic) {
        const shareUrl = `${window.location.origin}/share/${sessionId}`;
        await navigator.clipboard.writeText(shareUrl);
      } else {
        await navigator.clipboard.writeText(reportData.content);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  };

  const handleExport = async (type: 'pdf' | 'docx' | 'json' | 'md') => {
    if (!reportData) return;
    const filename = `Research_Report_${new Date().toISOString().split('T')[0]}`;
    setIsExportOpen(false);

    switch (type) {
      case 'pdf':
        await exportToPDF('report-content-body', `${filename}.pdf`);
        break;
      case 'docx':
        await exportToDOCX(reportData.content, "Intelligence Portfolio", `${filename}.docx`);
        break;
      case 'json':
        exportToJSON({ content: reportData.content, qualityScore: reportData.quality_score, timestamp: new Date() }, `${filename}.json`);
        break;
      case 'md':
        const element = document.createElement('a');
        const file = new Blob([reportData.content], { type: 'text/markdown' });
        element.href = URL.createObjectURL(file);
        element.download = `${filename}.md`;
        element.click();
        break;
    }
  };

  return (
    <div className="min-h-screen bg-white pt-24 font-sans text-slate-800">
      <main className="max-w-[760px] mx-auto px-6 py-10 space-y-6">
        
        {/* Back navigation & breadcrumbs */}
        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors group shadow-3xs"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div className="text-xs text-slate-400 flex items-center gap-1.5 uppercase font-bold tracking-wider">
            <Link href="/history" className="hover:text-emerald-600 transition-colors font-medium">History</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500">Report</span>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-6 pt-6">
            <div className="h-10 w-3/4 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-6 w-1/2 bg-slate-100 rounded-lg animate-pulse" />
            <div className="border-t border-slate-100 my-6" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-slate-100 rounded-md animate-pulse" />
              <div className="h-4 w-full bg-slate-100 rounded-md animate-pulse" />
              <div className="h-4 w-5/6 bg-slate-100 rounded-md animate-pulse" />
            </div>
          </div>
        )}

        {/* Error panel */}
        {error && !loading && (
          <div className="bg-white border border-rose-100 rounded-3xl p-10 text-center shadow-lg max-w-lg mx-auto">
            <h3 className="text-lg font-black text-slate-900 mb-2">Failed to load report</h3>
            <p className="text-sm text-slate-500 mb-6">{error}</p>
            <Link
              href="/history"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Back to History
            </Link>
          </div>
        )}

        {/* Medium-like Report Layout */}
        {reportData && !loading && (
          <article className="animate-in fade-in duration-300 space-y-6">
            
            {/* Title - Large, bold sans style */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-905 tracking-tight leading-tight font-sans mt-2 select-text">
              {reportData.query}
            </h1>

            {/* Author / Metadata Row (Medium Style) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-y border-slate-150/70 text-xs text-slate-500">
              
              {/* Left Profile details */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm font-black shadow-xs select-none">
                  RM
                </div>
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <span>ResearchMind Intelligence</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-black uppercase tracking-wider">Analyst</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
                    <span>{new Date(reportData.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span>•</span>
                    <span>{Number(reportData.duration_seconds).toFixed(1)}s synthesis</span>
                  </div>
                </div>
              </div>

              {/* Right Sharing & Context details */}
              <div className="flex items-center gap-2 relative" ref={dropdownRef}>
                
                {/* Quality Badge */}
                {reportData.quality_score !== null && (
                  <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-250/50 rounded-lg font-bold text-[10px] tracking-wide uppercase select-none">
                    <Award className="w-3.5 h-3.5" />
                    <span>Score: {reportData.quality_score}/10</span>
                  </div>
                )}

                {/* Share Toggle */}
                <button
                  onClick={() => handleTogglePublic(!isPublic)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                    isPublic 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-slate-55/10 text-slate-500 border-slate-200'
                  }`}
                  title={isPublic ? "Shared Link is Public" : "Only Private Access"}
                >
                  {isPublic ? <Globe className="w-3 h-3 text-emerald-500" /> : <Lock className="w-3 h-3" />}
                  <span>{isPublic ? 'Public' : 'Private'}</span>
                </button>

                {/* Copy link */}
                <button
                  onClick={handleCopy}
                  title={isPublic ? "Copy Public Link" : "Copy Report Markdown"}
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                    copied 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                </button>

                {/* Download dropdown toggle */}
                <button
                  onClick={() => setIsExportOpen(!isExportOpen)}
                  title="Export Intelligence"
                  className={`p-1.5 rounded-lg border transition-all cursor-pointer bg-white text-slate-500 border-slate-200 hover:bg-slate-50 ${
                    isExportOpen ? 'border-emerald-500 text-emerald-600' : ''
                  }`}
                >
                  <Download className="w-4 h-4" />
                </button>

                {/* Export Dropdown Box */}
                <AnimatePresence>
                  {isExportOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2.5 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-10 animate-in fade-in slide-in-from-top-2 duration-150 text-left font-sans"
                    >
                      <div className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 mb-1">
                        Export Document
                      </div>
                      <button 
                        onClick={() => handleExport('pdf')} 
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors text-left cursor-pointer"
                      >
                        <FileText className="w-4 h-4 text-rose-500" />
                        Professional PDF
                      </button>
                      <button 
                        onClick={() => handleExport('docx')} 
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors text-left cursor-pointer"
                      >
                        <FileCode className="w-4 h-4 text-indigo-500" />
                        Microsoft Word
                      </button>
                      <button 
                        onClick={() => handleExport('md')} 
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors text-left cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-slate-600" />
                        Markdown (MD)
                      </button>
                      <button 
                        onClick={() => handleExport('json')} 
                        className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors border-t border-slate-100 mt-1 text-left cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        Research JSON
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

            </div>

            {/* Markdown Report Content (Medium Serif Layout) */}
            <div className="select-text">
              <StreamingReport
                content={reportData.content}
                isStreaming={false}
                layout="medium"
              />
            </div>

          </article>
        )}

      </main>
    </div>
  );
}

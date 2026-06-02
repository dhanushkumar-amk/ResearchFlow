'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Award, Sparkles, Info } from 'lucide-react';
import Link from 'next/link';

import StreamingReport from '../../../../components/StreamingReport';
import { getSessionDetails } from '../../../../lib/api';
import { useAuth } from '../../../../lib/AuthContext';

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

  const [reportData, setReportData] = useState<ReportDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);

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

  return (
    <div className="min-h-screen bg-zinc-50/50 pt-16 font-sans">
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Back navigation & breadcrumbs */}
        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="p-2 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors group shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-zinc-500 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div className="text-sm text-zinc-400 flex items-center gap-1.5">
            <Link href="/history" className="hover:text-emerald-600 transition-colors font-medium">History</Link>
            <span className="text-zinc-300">/</span>
            <span className="text-zinc-650 font-bold">Report Archive</span>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-6">
            <div className="h-40 bg-zinc-100 rounded-3xl animate-pulse" />
            <div className="h-160 bg-zinc-100 rounded-3xl animate-pulse" />
          </div>
        )}

        {/* Error panel */}
        {error && !loading && (
          <div className="bg-white border border-red-100 rounded-3xl p-10 text-center shadow-xl max-w-lg mx-auto">
            <h3 className="text-lg font-black text-zinc-900 mb-2">Failed to load report</h3>
            <p className="text-sm text-zinc-500 mb-6">{error}</p>
            <Link
              href="/history"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Back to History
            </Link>
          </div>
        )}

        {/* Active Report Container */}
        {reportData && !loading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Elegant Header Block */}
            <div className="relative overflow-hidden bg-zinc-950 text-white rounded-3xl p-8 md:p-12 shadow-xl border border-zinc-900">
              {/* Soft decorative blur */}
              <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-emerald-50/10 rounded-full blur-[100px]" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-450 border border-emerald-500/30 text-[9px] font-black uppercase tracking-widest rounded-full flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Synthesized Discovery
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-[1.15] max-w-4xl text-white">
                  {reportData.query}
                </h1>

                <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-white/5 text-zinc-400 text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-zinc-500" />
                    <span>{new Date(reportData.created_at).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  {reportData.quality_score !== null && (
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
                      <Award className="w-3.5 h-3.5" />
                      <span>Quality Index: {reportData.quality_score}/10</span>
                    </div>
                  )}
                  {reportData.duration_seconds !== null && (
                    <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 rounded-lg">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      <span>Speed: {Number(reportData.duration_seconds).toFixed(1)}s</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Focused Single Column Report */}
            <div className="shadow-sm">
              <StreamingReport
                content={reportData.content}
                isStreaming={false}
                qualityScore={reportData.quality_score}
                durationSeconds={reportData.duration_seconds}
                sessionId={sessionId}
                isPublic={isPublic}
                onTogglePublic={handleTogglePublic}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

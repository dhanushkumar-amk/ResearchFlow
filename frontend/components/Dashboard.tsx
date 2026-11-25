'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, ArrowRight, BookOpen, Clock3, Compass, FileText } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { getAllResearchHistory, getHistory } from '../lib/api';
import type { Document, ResearchHistoryItem } from '../types/research';

type WorkspaceData = {
  token: string;
  history: ResearchHistoryItem[] | null;
  documents: Document[] | null;
};

function isComplete(item: ResearchHistoryItem) {
  return item.status === 'complete' || (item.status !== 'failed' && (item.quality_score ?? 0) > 0);
}

function dateKey(date: Date) {
  return [date.getFullYear(), date.getMonth(), date.getDate()].join('-');
}

function ResearchActivity({ history }: { history: ResearchHistoryItem[] }) {
  const counts = new Map<string, number>();
  for (const item of history) {
    const key = dateKey(new Date(item.created_at));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + index);
    return {
      key: dateKey(date),
      label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      count: counts.get(dateKey(date)) ?? 0,
    };
  });
  const largestCount = Math.max(1, ...days.map(day => day.count));

  return (
    <ul className="mt-5 grid grid-cols-7 gap-1.5 text-center text-xs text-slate-600" aria-label="Research runs in the last seven days">
      {days.map(({ key, label, count }) => (
        <li key={key} aria-label={`${label}, ${count} runs`} className="min-w-0" title={`${label}: ${count} runs`}>
          <div className="flex h-28 items-end justify-center rounded-lg bg-slate-50 px-1 pb-1" aria-hidden="true">
            <div className="w-full max-w-9 rounded-md bg-indigo-500" style={{ height: count ? `${count / largestCount * 88}%` : '3px', opacity: count ? 1 : .2 }} />
          </div>
          <span className="mt-2 block font-semibold">{label}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const { user, token } = useAuth();
  const [data, setData] = useState<WorkspaceData | null>(null);

  useEffect(() => {
    if (!token) return;
    let current = true;
    Promise.allSettled([getAllResearchHistory(token), getHistory(token)]).then(([history, documents]) => {
      if (current) setData({
        token,
        history: history.status === 'fulfilled' ? history.value : null,
        documents: documents.status === 'fulfilled' ? documents.value : null,
      });
    });
    return () => { current = false; };
  }, [token]);

  const workspace = data && data.token === token ? data : null;
  const history = workspace?.history ?? [];
  const documents = workspace?.documents ?? [];
  const statusCounts = {
    completed: history.filter(isComplete).length,
    failed: history.filter(item => item.status === 'failed').length,
    pending: history.filter(item => item.status !== 'failed' && !isComplete(item)).length,
  };
  const scores = history.flatMap(item => item.quality_score === null ? [] : [Number(item.quality_score)]);
  const qualityBands = [
    { label: 'Excellent', count: scores.filter(score => score >= 8).length },
    { label: 'Good', count: scores.filter(score => score >= 6 && score < 8).length },
    { label: 'Fair', count: scores.filter(score => score >= 4 && score < 6).length },
    { label: 'Low', count: scores.filter(score => score < 4).length },
  ];
  const average = scores.length ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) : '—';
  const recentDate = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const metrics = [
    { label: 'Research runs', value: workspace?.history ? history.length : '—', icon: Compass },
    { label: 'Completed reports', value: workspace?.history ? statusCounts.completed : '—', icon: FileText },
    { label: 'Average report score', value: average === '—' ? average : `${average}/10`, icon: Activity },
    { label: 'Library sources', value: workspace?.documents ? documents.length : '—', icon: BookOpen },
  ];

  return (
    <main className="rf-dashboard space-y-6">
      <div className="rf-dashboard-banner flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-sm font-semibold text-indigo-200">Research overview</p>
          <h1>Welcome, {user?.name.trim().split(/\s+/)[0] || 'researcher'}</h1>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-indigo-100">Start a new investigation, revisit your reports, or add sources to your library.</p>
        </div>
        <Link href="/research" className="rf-button shrink-0 bg-white text-indigo-900 hover:bg-indigo-100">
          New research <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </div>

      {workspace && (!workspace.history || !workspace.documents) && (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Some workspace data could not be loaded. Refresh the page to try again.</p>
      )}

      <dl className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rf-panel">
            <span className="rf-icon-tile"><Icon size={18} aria-hidden="true" /></span>
            <dt className="mt-3 text-xs font-medium text-slate-600 sm:text-sm">{label}</dt>
            <dd className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <section className="rf-panel" aria-labelledby="recent-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="recent-heading">Recent research</h2>
            <Link href="/history" className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:underline">View history <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
          {!workspace ? (
            <p className="mt-5 text-sm text-slate-600" role="status">Loading recent research…</p>
          ) : !workspace.history ? (
            <p className="mt-5 text-sm text-slate-600">Research history is currently unavailable.</p>
          ) : history.length ? (
            <ul className="mt-3 divide-y divide-slate-100">
              {history.slice(0, 5).map(item => {
                const completed = isComplete(item);
                return (
                  <li key={item.session_id}>
                    <Link href={`/research/${item.session_id}`} className="flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-indigo-50">
                      <FileText size={17} className="shrink-0 text-indigo-700" aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{item.query}</span>
                        <time dateTime={item.created_at} className="mt-1 block text-xs text-slate-600">{recentDate.format(new Date(item.created_at))}</time>
                      </span>
                      <span className={`hidden rounded-full px-2 py-1 text-xs font-semibold sm:inline ${completed ? 'bg-emerald-50 text-emerald-800' : item.status === 'failed' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-900'}`}>
                        {completed ? 'Complete' : item.status === 'failed' ? 'Failed' : 'In progress'}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 px-4 py-7 text-center">
              <Clock3 size={22} className="mx-auto text-indigo-700" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold">No research runs yet</p>
              <Link href="/research" className="mt-2 inline-block text-sm font-semibold text-indigo-700 hover:underline">Start your first investigation</Link>
            </div>
          )}
        </section>

        <section className="rf-panel" aria-labelledby="activity-heading">
          <h2 id="activity-heading">Research activity</h2>
          <p className="mt-1 text-sm text-slate-600">Runs in the past seven days</p>
          {workspace?.history ? <ResearchActivity history={history} /> : (
            <p className="mt-5 text-sm text-slate-600">{workspace ? 'Activity is currently unavailable.' : 'Loading activity…'}</p>
          )}
          {workspace?.history && (
            <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-600">
              {statusCounts.completed} complete · {statusCounts.pending} in progress · {statusCounts.failed} failed
            </p>
          )}
        </section>
      </div>

      {scores.length > 0 && (
        <section className="rf-panel" aria-labelledby="quality-heading">
          <h2 id="quality-heading">Report quality</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {qualityBands.map(({ label, count }) => (
              <div key={label} className="rounded-lg bg-indigo-50 px-3 py-2">
                <dt className="text-xs text-indigo-900">{label}</dt>
                <dd className="text-lg font-bold text-indigo-950">{count}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="rf-panel flex flex-wrap items-center justify-between gap-3" aria-labelledby="library-heading">
        <div>
          <h2 id="library-heading">Source library</h2>
          <p className="mt-1 text-sm text-slate-600">Manage the documents and links that inform your research.</p>
        </div>
        <Link href="/documents" className="rf-button rf-button-outline">Open library <ArrowRight size={16} aria-hidden="true" /></Link>
      </section>
    </main>
  );
}

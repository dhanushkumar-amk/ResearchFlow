import type { Metadata } from 'next';
import Link from 'next/link';
import { cache } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import Brand from '@/components/Brand';
import StreamingReport from '@/components/StreamingReport';

interface PublicReport {
  query: string;
  content: string;
  quality_score: number | null;
  created_at: string;
}

type SharePageProps = { params: Promise<{ sessionId: string }> };

const loadReport = cache(async (sessionId: string): Promise<PublicReport | null> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/research/${encodeURIComponent(sessionId)}/public`, { cache: 'no-store' });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { sessionId } = await params;
  const report = await loadReport(sessionId);
  if (!report) return { title: 'Shared report | ResearchFlow' };

  const title = `${report.query} | ResearchFlow`;
  const description = report.content.replace(/[#*_]/g, '').slice(0, 160);
  return {
    title,
    description,
    openGraph: {
      type: 'article',
      title,
      description,
      siteName: 'ResearchFlow',
      publishedTime: report.created_at,
    },
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { sessionId } = await params;
  const report = await loadReport(sessionId);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-slate-200 bg-white">
        <div className="rf-landing-width flex min-h-18 items-center justify-between gap-3">
          <Brand />
          <Link href="/register" className="rf-button rf-button-primary">Get started <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 space-y-5 py-8 sm:py-12">
        {report ? (
          <>
            <header className="rf-dashboard-banner">
              <p className="mb-3 text-sm font-semibold text-indigo-200">Shared research report</p>
              <h1 className="break-words text-3xl font-bold leading-tight tracking-tight sm:text-5xl">{report.query}</h1>
              <time dateTime={report.created_at} className="mt-4 block text-sm text-indigo-100">
                {new Date(report.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
              </time>
            </header>
            <StreamingReport content={report.content} isStreaming={false} qualityScore={report.quality_score} sessionId={sessionId} />
          </>
        ) : (
          <section className="rf-panel mx-auto max-w-md text-center">
            <span className="rf-icon-tile"><LockKeyhole size={20} aria-hidden="true" /></span>
            <h1 className="mt-3 text-xl font-bold">Report unavailable</h1>
            <p className="my-4 text-sm leading-relaxed text-slate-600">This report may have been removed or its sharing link disabled.</p>
            <Link href="/" className="rf-button rf-button-outline">Back to ResearchFlow</Link>
          </section>
        )}
      </main>
    </div>
  );
}

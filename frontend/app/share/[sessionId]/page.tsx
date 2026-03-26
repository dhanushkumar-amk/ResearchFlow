import { Metadata } from 'next';
import StreamingReport from '@/components/StreamingReport';
import Navbar from '@/components/Navbar';
import { Info, ShieldAlert, Zap, Globe, Share2 } from 'lucide-react';
import React from 'react';

interface PublicReportData {
  query: string;
  content: string;
  quality_score: number | null;
  sources: any[];
  created_at: string;
}

/**
 * SEO Optimization: Dynamic Metadata Generation
 * For Server-Side Rendering (SSR) of social and search engine tags.
 */
export async function generateMetadata({ params }: { params: { sessionId: string } }): Promise<Metadata> {
  const { sessionId } = params;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/research/${sessionId}/public`, { 
        cache: 'no-store' 
    });
    
    if (!res.ok) return { title: 'Research Portfolio | ResearchFlow' };
    
    const data: PublicReportData = await res.json();
    const cleanTitle = data.query.length > 60 ? data.query.substring(0, 60) + '...' : data.query;
    const cleanDesc = data.content.substring(0, 160).replace(/[#*_]/g, '') + '...';

    return {
      title: `${cleanTitle} | ResearchFlow Intelligence`,
      description: cleanDesc,
      openGraph: {
        title: cleanTitle,
        description: cleanDesc,
        type: 'article',
        publishedTime: data.created_at,
        authors: ['ResearchFlow AI'],
        siteName: 'ResearchFlow',
        images: [
          {
            url: `https://research-flow.vcap.me/api/og?title=${encodeURIComponent(data.query)}`,
            width: 1200,
            height: 630,
            alt: data.query,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: cleanTitle,
        description: cleanDesc,
        images: [`https://research-flow.vcap.me/api/og?title=${encodeURIComponent(data.query)}`],
      },
    };
  } catch (err) {
    return { title: 'Discovery Portfolio | ResearchFlow' };
  }
}

export default async function SharePage({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  let reportData: PublicReportData | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/research/${sessionId}/public`, {
        cache: 'no-store'
    });
    if (!response.ok) {
        throw new Error('Public report not found or research sharing is disabled.');
    }
    reportData = await response.json();
  } catch (err: any) {
    error = err.message;
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white border border-red-100 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
             <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-zinc-900 mb-2 font-display">Discovery Locked</h1>
          <p className="text-zinc-500 text-sm mb-8">{error}</p>
          <a href="/" className="inline-block bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200">
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      {/* Dynamic Header with Premium Gradients */}
      <main className="max-w-5xl mx-auto px-6 pt-24 pb-20">
        <div className="relative group mb-12">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 blur-[80px] opacity-10 rounded-full" />
            <div className="relative bg-zinc-900 text-white rounded-[40px] p-10 md:p-14 shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/20 rounded-full blur-[100px]" />
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full border border-blue-500/30 text-[10px] font-black uppercase tracking-[2px] text-blue-400">
                           <Globe className="w-3 h-3" />
                           Public intelligence
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-zinc-800 rounded-full border border-zinc-700 text-[10px] font-black uppercase tracking-[2px] text-zinc-400">
                           <Zap className="w-3 h-3 text-amber-500" />
                           Synthesized Report
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-8 max-w-3xl">
                        {reportData.query}
                    </h1>

                    <div className="flex flex-wrap items-center gap-8 pt-6 border-t border-white/10">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                              <Info className="w-5 h-5 text-zinc-400" />
                           </div>
                           <div>
                              <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-0.5">Analysed By</p>
                              <p className="text-sm font-bold">ResearchFlow AI Agent</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                              <Share2 className="w-5 h-5 text-zinc-400" />
                           </div>
                           <div>
                              <p className="text-[10px] uppercase font-black tracking-widest text-zinc-500 mb-0.5">Discovery Date</p>
                              <p className="text-sm font-bold">{new Date(reportData.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                           </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8">
                <StreamingReport 
                  content={reportData.content} 
                  isStreaming={false} 
                  qualityScore={reportData.quality_score}
                  sessionId={sessionId}
                />
            </div>
            
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-8 sticky top-24">
                    <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-600" /> 
                        Why ResearchFlow?
                    </h3>
                    <p className="text-sm text-zinc-600 leading-relaxed font-medium mb-6">
                        This report was autonomously synthesized using multiple global archives, private knowledge indices, and real-time web discovery.
                    </p>
                    <ul className="space-y-4 mb-8">
                        {['Evidence-Based Analysis', 'Deep Citation Network', 'Multi-Agent Synthesis', 'Real-time Verification'].map((item) => (
                            <li key={item} className="flex items-center gap-3 text-xs font-bold text-zinc-800">
                                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                                {item}
                            </li>
                        ))}
                    </ul>
                    <a href="/register" className="w-full inline-flex items-center justify-center bg-blue-600 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-100">
                        Create Your Report
                    </a>
                </div>
            </div>
        </div>

        <div className="mt-20 py-12 border-t border-zinc-100 text-center">
          <p className="text-zinc-400 text-[10px] font-black uppercase tracking-[3px]">
            &copy; {new Date().getFullYear()} ResearchFlow Intelligence Platform &bull; All Rights Reserved
          </p>
        </div>
      </main>
    </div>
  );
}

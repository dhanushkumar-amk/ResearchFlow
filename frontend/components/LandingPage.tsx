import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, FileSearch, Globe2 } from 'lucide-react';
import Brand from './Brand';

const features = [
  {
    icon: Globe2,
    title: 'Research the web',
    description: 'Start with a question. Research agents gather relevant sources and organize what they find.',
  },
  {
    icon: BookOpen,
    title: 'Build a source library',
    description: 'Add documents, websites, and YouTube transcripts to give your research more context.',
  },
  {
    icon: FileSearch,
    title: 'Work with your report',
    description: 'Ask follow-up questions, revisit earlier research, and share the reports you choose to make public.',
  },
];

export default function LandingPage() {
  return (
    <div className="rf-landing min-h-screen">
      <header className="rf-landing-header">
        <div className="rf-landing-width flex min-h-18 items-center justify-between gap-3">
          <Brand />
          <nav aria-label="Main navigation" className="flex items-center gap-2 sm:gap-5">
            <a href="#workflow" className="hidden text-sm font-semibold text-slate-600 hover:text-indigo-700 sm:inline">How it works</a>
            <Link href="/login" className="rf-button rf-button-quiet">Sign in</Link>
            <Link href="/register" className="rf-button rf-button-primary hidden sm:inline-flex">Get started</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="rf-hero rf-landing-width">
          <div className="rf-hero-copy">
            <p className="rf-eyebrow">AI research workspace</p>
            <h1>Follow the evidence.</h1>
            <p className="rf-hero-summary">Turn complex questions into structured reports. Bring your own sources, see what the research agents find, and keep asking better questions.</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/register" className="rf-button rf-button-primary">Start researching <ArrowRight size={17} aria-hidden="true" /></Link>
              <a href="#workflow" className="rf-button rf-button-outline">Explore the workflow</a>
            </div>
          </div>
          <div className="rf-hero-visual">
            <Image src="/research-still-life.webp" alt="" fill sizes="(max-width: 900px) 92vw, 600px" preload />
          </div>
        </section>

        <section id="workflow" className="rf-landing-width rf-features" aria-labelledby="workflow-title">
          <h2 id="workflow-title">From question to report</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rf-feature">
                <span className="rf-icon-tile"><Icon size={21} aria-hidden="true" /></span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="rf-landing-width rf-footer">
        <Brand />
        <a href="https://github.com/dhanushkumar-amk/ResearchFlow" className="text-sm font-semibold text-slate-600 hover:text-indigo-700">GitHub</a>
      </footer>
    </div>
  );
}

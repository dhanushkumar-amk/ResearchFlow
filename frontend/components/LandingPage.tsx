'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Clock3, Compass, LayoutGrid } from 'lucide-react';
import Brand from './Brand';

const choices = [
  { title: 'Start an investigation', icon: Compass, color: 'violet', route: '/research', description: 'Ask a question and get a report grounded in sources.', details: ['Search the web and your library', 'Follow the research as it runs', 'Ask follow-up questions about the report'] },
  { title: 'Build a source library', icon: BookOpen, color: 'green', route: '/documents', description: 'Collect documents, articles, and video transcripts in one place.', details: ['Add files and links', 'Ask questions about your sources', 'Use your sources in future investigations'] },
  { title: 'Revisit a report', icon: Clock3, color: 'orange', route: '/history', description: 'Find earlier investigations and return to the reading.', details: ['Search your research history', 'Review saved reports', 'Export or share your findings'] },
  { title: 'Open the workspace', icon: LayoutGrid, color: 'blue', route: '/', description: 'Get an overview of your research and the sources behind it.', details: ['See recent research', 'Review report activity', 'Jump to your source library'] },
] as const;

export default function LandingPage() {
  const [selected, setSelected] = useState<(typeof choices)[number] | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const lastChoice = useRef<HTMLButtonElement | null>(null);
  const preview = selected ?? choices[0];
  const Icon = preview.icon;
  const next = encodeURIComponent(preview.route);

  return (
    <main className="rf-entry">
      <section className="rf-entry-art" aria-label="About ResearchFlow">
        <Image src="/research-observatory.webp" alt="" fill sizes="(max-width: 800px) 100vw, 47vw" preload />
        <div className="rf-entry-note">
          <Brand />
          <h2>{selected ? selected.title : 'A place to follow a question.'}</h2>
          <ul>
            {(selected?.details ?? ['Research a question from multiple sources', 'Work with documents and links you bring', 'Return to your reports whenever you need them']).map(detail => (
              <li key={detail}><Check size={16} aria-hidden="true" /> {detail}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rf-entry-main" aria-labelledby="entry-heading">
        <div className="rf-entry-top">
          {selected ? (
            <button type="button" className="rf-entry-back" aria-label="Back to choices" onClick={() => {
              setSelected(null);
              requestAnimationFrame(() => lastChoice.current?.focus());
            }}><ArrowLeft size={18} aria-hidden="true" /></button>
          ) : <span className="text-sm font-semibold text-zinc-600">Get started</span>}
          <span className="text-sm tabular-nums text-zinc-600">{selected ? '2 / 2' : '1 / 2'}</span>
        </div>
        <div className="rf-entry-content">
          <h1 id="entry-heading" ref={heading} tabIndex={-1}>{selected ? 'Continue to ResearchFlow' : 'What would you like to do?'}</h1>
          {selected ? (
            <div className="rf-entry-next">
              <div className="rf-choice-icon" data-color={preview.color}><Icon size={23} aria-hidden="true" /></div>
              <h2>{selected.title}</h2>
              <p>{selected.description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link className="rf-button rf-button-primary" href={`/register?next=${next}`}>Create account <ArrowRight size={16} aria-hidden="true" /></Link>
                <Link className="rf-button rf-button-outline" href={`/login?next=${next}`}>Sign in</Link>
              </div>
            </div>
          ) : (
            <>
              <div className="rf-choice-grid">
                {choices.map(choice => {
                  const ChoiceIcon = choice.icon;
                  return (
                    <button key={choice.route} type="button" className="rf-choice" onClick={event => {
                      lastChoice.current = event.currentTarget;
                      setSelected(choice);
                      requestAnimationFrame(() => heading.current?.focus());
                    }} ref={element => {
                      if (element && lastChoice.current?.dataset.route === choice.route) lastChoice.current = element;
                    }} data-route={choice.route}>
                      <span className="rf-choice-icon" data-color={choice.color}><ChoiceIcon size={24} aria-hidden="true" /></span>
                      <strong>{choice.title}</strong>
                      <span>{choice.description}</span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-6 text-sm text-zinc-600">Already have an account? <Link className="font-semibold text-zinc-950 underline underline-offset-4" href="/login">Sign in</Link></p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

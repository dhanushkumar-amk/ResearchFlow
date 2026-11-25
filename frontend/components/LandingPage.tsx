import Link from 'next/link';
import { ArrowRight, BookOpen, FileText, Globe2, History, MessageSquare, Share2 } from 'lucide-react';
import Brand from './Brand';

const features = [
  { title: 'Investigate a question', description: 'Search the web for relevant material and bring the findings together in a report.', icon: Globe2, tone: 'blue' },
  { title: 'Collect your sources', description: 'Keep documents, articles, and video transcripts together in your own library.', icon: BookOpen, tone: 'sand' },
  { title: 'Read the report', description: 'See the findings and their source references in one readable view.', icon: FileText, tone: 'lavender' },
  { title: 'Ask a follow-up', description: 'Clarify a passage or explore a question that came up while reading.', icon: MessageSquare, tone: 'mint' },
  { title: 'Return to earlier work', description: 'Find previous investigations and reopen the reports you saved.', icon: History, tone: 'peach' },
  { title: 'Share your findings', description: 'Export a report or choose to make it available through a public link.', icon: Share2, tone: 'rose' },
];

export default function LandingPage() {
  return (
    <div className="rf-public">
      <header className="rf-public-bar">
        <div className="rf-public-width rf-public-nav">
          <Brand />
          <nav className="flex items-center gap-3 sm:gap-6" aria-label="Main navigation">
            <a href="#workflow" className="hidden text-sm font-medium sm:inline">How it works</a>
            <Link href="/login" className="text-sm font-medium">Sign in</Link>
            <Link href="/get-started" className="rf-public-action">Get started <ArrowRight size={15} aria-hidden="true" /></Link>
          </nav>
        </div>
      </header>

      <main className="rf-public-width rf-public-main">
        <section className="rf-public-hero" aria-labelledby="public-title">
          <div className="rf-public-hero-frame">
            <div className="rf-public-pixels" aria-hidden="true">
              <span /><span /><span /><span /><span /><span />
            </div>
            <div className="rf-public-hero-copy">
              <h1 id="public-title">Good research starts with a better question.</h1>
              <p>Search the web, bring your own sources, and turn what you find into a report you can keep working with.</p>
              <Link href="/get-started" className="rf-public-action">Start researching <ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </div>
        </section>

        <section id="workflow" className="rf-public-workflow" aria-labelledby="workflow-title">
          <h2 id="workflow-title">From question to findings</h2>
          <p>Keep the sources, the report, and your follow-up questions in one workspace.</p>
          <div className="rf-public-grid">
            {features.map(({ title, description, icon: Icon, tone }) => (
              <article key={title} className="rf-public-feature" data-tone={tone}>
                <Icon size={20} aria-hidden="true" />
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="rf-public-width rf-public-footer">
        <Brand />
        <a href="https://github.com/dhanushkumar-amk/ResearchFlow" className="text-sm font-medium">View on GitHub</a>
      </footer>
    </div>
  );
}

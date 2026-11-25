import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, BookOpen, FileText, Globe2, History, Search } from 'lucide-react';
import Brand from './Brand';
import ObservatoryArt from './ObservatoryArt';

const workflows = [
  {
    title: 'Investigate a question',
    description: 'Search the web and your library together. Follow the research as it runs and see the findings in a single report.',
    image: '/landing/research.webp',
    tone: 'blue',
    links: [
      { label: 'Start an investigation', icon: Search, href: '/login?next=%2Fresearch' },
      { label: 'Explore the workspace', icon: Globe2, href: '/get-started' },
    ],
  },
  {
    title: 'Build a source library',
    description: 'Bring the documents, articles, and video transcripts you already use into a library you can search and ask about.',
    image: '/landing/library.webp',
    tone: 'amber',
    links: [
      { label: 'Add documents and links', icon: BookOpen, href: '/login?next=%2Fdocuments' },
    ],
  },
  {
    title: 'Work with your findings',
    description: 'Pick up a saved investigation, ask questions about the report, or export it for your own notes.',
    image: '/landing/reports.webp',
    tone: 'mint',
    links: [
      { label: 'Browse research history', icon: History, href: '/login?next=%2Fhistory' },
      { label: 'Open the dashboard', icon: FileText, href: '/login?next=%2F' },
    ],
  },
];

const repository = 'https://github.com/dhanushkumar-amk/ResearchFlow';

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

      <main>
        <section className="rf-public-hero" aria-labelledby="public-title">
          <div className="rf-public-width rf-public-hero-copy">
            <h1 id="public-title">Follow the evidence.<br />Find the bigger picture.</h1>
            <p>Search the web, bring your own sources, and turn what you find into a report you can keep working with.</p>
            <div className="rf-public-hero-actions">
              <Link href="/get-started" className="rf-public-action">Start researching <ArrowRight size={17} aria-hidden="true" /></Link>
              <a href={repository} className="rf-public-secondary">View on GitHub <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
          </div>
        </section>

        <section id="workflow" className="rf-public-width rf-public-workflow" aria-labelledby="workflow-title">
          <h2 id="workflow-title">From question to findings</h2>
          <div className="rf-public-grid">
            {workflows.map(({ title, description, image, tone, links }) => (
              <article key={title} className="rf-public-feature" data-tone={tone}>
                <div className="rf-public-feature-art">
                  <Image src={image} alt="" fill sizes="(max-width: 760px) 100vw, (max-width: 1240px) 33vw, 390px" />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
                <ul>
                  {links.map(({ label, icon: Icon, href }) => (
                    <li key={label}>
                      <Link href={href} className="rf-public-feature-link">
                        <Icon size={17} aria-hidden="true" />
                        <span>{label}</span>
                        <ArrowRight size={16} aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="rf-public-width rf-public-invitation" aria-labelledby="invitation-title">
          <ObservatoryArt className="rf-public-landscape" sizes="(max-width: 760px) 100vw, 560px" />
          <div>
            <h2 id="invitation-title">What are you curious about?</h2>
            <p>Bring a question, a document, or a link to get your first investigation underway.</p>
            <Link href="/get-started" className="rf-public-action">Get started <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </section>
      </main>

      <footer className="rf-public-width rf-public-footer">
        <Brand />
        <a href={repository} className="text-sm font-medium">View on GitHub</a>
      </footer>
    </div>
  );
}

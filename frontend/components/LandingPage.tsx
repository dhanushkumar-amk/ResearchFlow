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

const steps = [
  { title: 'Write the question', description: 'Start with what you want to find out. Add the constraints or comparisons that matter to you.' },
  { title: 'Gather the evidence', description: 'ResearchFlow searches the web and checks the documents and links in your library.' },
  { title: 'Read and follow up', description: 'Review the report, ask about a specific passage, or export the findings for later.' },
];

const repository = 'https://github.com/dhanushkumar-amk/ResearchFlow';

export default function LandingPage() {
  return (
    <div className="rf-public">
      <header className="rf-public-bar">
        <div className="rf-public-width rf-public-nav">
          <Brand />
          <nav className="flex items-center gap-3 sm:gap-6" aria-label="Main navigation">
            <a href="#workflow" className="hidden text-sm font-medium md:inline">Tools</a>
            <a href="#process" className="hidden text-sm font-medium sm:inline">How it works</a>
            <Link href="/login" className="text-sm font-medium">Sign in</Link>
            <Link href="/get-started" className="rf-public-action">Get started <ArrowRight size={15} aria-hidden="true" /></Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="rf-public-width rf-public-hero" aria-labelledby="public-title">
          <div className="rf-public-hero-copy">
            <h1 id="public-title">Turn a question into a clear report.</h1>
            <p>Research the web alongside your own documents. Follow the sources, ask better follow-up questions, and save what you find.</p>
            <div className="rf-public-hero-actions">
              <Link href="/get-started" className="rf-public-action">Start researching <ArrowRight size={17} aria-hidden="true" /></Link>
              <a href="#process" className="rf-public-secondary">See how it works</a>
            </div>
          </div>

          <figure className="rf-hero-preview">
            <ObservatoryArt className="rf-hero-preview-art" sizes="(max-width: 760px) 100vw, 600px" priority />
            <figcaption className="rf-hero-preview-sheet">
              <span className="rf-hero-preview-label"><FileText size={16} aria-hidden="true" /> Sample report outline</span>
              <p className="rf-hero-preview-title">How can cities cool their streets?</p>
              <ul>
                <li><Globe2 size={17} aria-hidden="true" /> Compare shade from trees and built structures</li>
                <li><BookOpen size={17} aria-hidden="true" /> Review local heat maps and planting plans</li>
                <li><Search size={17} aria-hidden="true" /> Identify streets to prioritize</li>
              </ul>
            </figcaption>
          </figure>
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

        <section id="process" className="rf-public-process" aria-labelledby="process-title">
          <div className="rf-public-width rf-process-inner">
            <div>
              <h2 id="process-title">How research works</h2>
              <ol>
                {steps.map(({ title, description }) => (
                  <li key={title}>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </li>
                ))}
              </ol>
            </div>
            <figure className="rf-example">
              <figcaption><FileText size={17} aria-hidden="true" /> Example investigation</figcaption>
              <div className="rf-example-body">
                <p className="rf-example-title">Which trees provide the most shade on city streets?</p>
                <dl>
                  <div><dt>Bring</dt><dd>A local tree inventory or an urban forestry plan.</dd></div>
                  <div><dt>Compare</dt><dd>Canopy width, water needs, and tolerance of paved streets.</dd></div>
                  <div><dt>Follow up</dt><dd>Ask which options suit narrow sidewalks.</dd></div>
                </dl>
              </div>
            </figure>
          </div>
        </section>

        <section className="rf-public-width rf-public-invitation" aria-labelledby="invitation-title">
          <div className="rf-observatory rf-public-landscape" aria-hidden="true">
            <Image src="/landing/research-desk.webp" alt="" fill sizes="(max-width: 760px) 100vw, 450px" />
          </div>
          <div>
            <h2 id="invitation-title">Start with one question.</h2>
            <p>Add a document or a link if you have one. You can also start with a question alone.</p>
            <Link href="/get-started" className="rf-public-action">Get started <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </section>
      </main>

      <footer className="rf-public-width rf-public-footer">
        <Brand />
        <a href={repository} className="inline-flex items-center gap-2 text-sm font-medium">View on GitHub <ArrowUpRight size={15} aria-hidden="true" /></a>
      </footer>
    </div>
  );
}

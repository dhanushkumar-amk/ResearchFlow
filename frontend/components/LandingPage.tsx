import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, FileText, Globe2, History, Search } from 'lucide-react';
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
        <section className="rf-public-hero rf-public-width" aria-labelledby="public-title">
          <ObservatoryArt className="rf-hero-landscape" sizes="(max-width: 1240px) 100vw, 1240px" priority />
          <div className="rf-public-hero-copy">
            <h1 id="public-title">Find the bigger picture.</h1>
            <p>Start with a question. Follow the evidence across the web and your own sources, then bring it together in a report.</p>
            <div className="rf-public-hero-actions">
              <Link href="/get-started" className="rf-public-action">Start researching <ArrowRight size={17} aria-hidden="true" /></Link>
              <a href="#process" className="rf-public-secondary">See how it works <ArrowDown size={16} aria-hidden="true" /></a>
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
        <a href={repository} className="inline-flex items-center gap-2 text-sm font-medium">View on GitHub <ArrowUpRight size={15} aria-hidden="true" /></a>
      </footer>
    </div>
  );
}

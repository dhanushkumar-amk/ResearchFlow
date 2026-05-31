'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/AuthContext';
import {
  Brain,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Loader,
  ShieldCheck,
  Check,
  Layout,
  BookOpen,
  Cpu,
  Key,
  Info,
  FileText,
  Download,
  ShieldAlert,
  Blocks,
  TrendingUp,
  GraduationCap,
  Terminal,
  FolderLock,
  X,
  Loader2,
  Lock,
  HelpCircle,
  CreditCard,
  BarChart3,
  Microscope,
  ListChecks,
  Globe,
  Database
} from 'lucide-react';

const Lucide = {
  Brain,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Loader,
  ShieldCheck,
  Check,
  Layout,
  BookOpen,
  Cpu,
  Key,
  Info,
  FileText,
  Download,
  ShieldAlert,
  Blocks,
  TrendingUp,
  GraduationCap,
  Terminal,
  FolderLock,
  X,
  Loader2,
  Lock,
  HelpCircle,
  CreditCard,
  BarChart3,
  Microscope,
  ListChecks,
  Globe,
  Database
};

import { motion, AnimatePresence } from 'framer-motion';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

// Radar data comparing ResearchMind (PRD multi-agent) with Standard RAG
const radarData = [
  { metric: 'Faithfulness', ResearchMind: 96, StandardRAG: 72 },
  { metric: 'Relevance', ResearchMind: 94, StandardRAG: 68 },
  { metric: 'Context Coverage', ResearchMind: 90, StandardRAG: 55 },
  { metric: 'Citation Accuracy', ResearchMind: 98, StandardRAG: 60 },
  { metric: 'Speed', ResearchMind: 85, StandardRAG: 80 },
  { metric: 'Synthesis Quality', ResearchMind: 95, StandardRAG: 65 },
];

// Area data for research throughput / accuracy over time
const throughputData = [
  { month: 'Jan', Accuracy: 88, Efficiency: 60 },
  { month: 'Feb', Accuracy: 90, Efficiency: 65 },
  { month: 'Mar', Accuracy: 91, Efficiency: 74 },
  { month: 'Apr', Accuracy: 94, Efficiency: 82 },
  { month: 'May', Accuracy: 96, Efficiency: 89 },
  { month: 'Jun', Accuracy: 98, Efficiency: 95 },
];

// Demo query data based on PRD use cases
const DEMO_QUERIES = [
  {
    id: 'market',
    label: 'Market Trend',
    icon: 'BarChart3',
    query: 'Analyze EV solid-state battery commercialization timeline for 2026-2030.',
    steps: [
      { agent: 'Planner', text: 'Divided query into 3 research threads: Solid-state tech maturity, OEM contracts, and resource constraints.', status: 'done' },
      { agent: 'Retrieval', text: 'Retrieved 8 papers from ArXiv and 4 company annual reports from Qdrant vector store.', status: 'done' },
      { agent: 'Research', text: 'Fetched real-time Tavily search results for recent Toyota & Samsung SDI announcements.', status: 'done' },
      { agent: 'Critic', text: 'Flagged one source as outdated (2022 proposal). Prompted ResearchAgent for 2026 updates.', status: 'done' },
      { agent: 'Summary', text: 'Compiled report: "EV Solid-State Batteries: 2026-2030 Commercial Outlook" (12 citations).', status: 'done' }
    ]
  },
  {
    id: 'academic',
    label: 'Literature Review',
    icon: 'GraduationCap',
    query: 'Synthesize recent advancements in model pruning vs quantization for local LLM execution.',
    steps: [
      { agent: 'Planner', text: 'Identified core comparison aspects: Memory footprint, latency, and perplexity scores.', status: 'done' },
      { agent: 'Retrieval', text: 'Extracted 12 academic preprints from local storage index.', status: 'done' },
      { agent: 'Research', text: 'Queried arXiv and HuggingFace logs for latest llama.cpp quantization benchmarks.', status: 'done' },
      { agent: 'Critic', text: 'Verified that perplexity comparisons are grounded on same evaluation datasets (Wikitext-2).', status: 'done' },
      { agent: 'Summary', text: 'Synthesized report: "Pruning vs Quantization: Memory/Performance Trade-offs in Edge LLMs".', status: 'done' }
    ]
  },
  {
    id: 'clinical',
    label: 'Medical Science',
    icon: 'Microscope',
    query: 'Review therapeutic efficacy of GLP-1 agonists beyond glycemic control.',
    steps: [
      { agent: 'Planner', text: 'Mapped non-glycemic clinical trials: Cardiovascular, neurological, and kidney health outcomes.', status: 'done' },
      { agent: 'Retrieval', text: 'Retrieved 15 PubMed trial abstracts from local vector store.', status: 'done' },
      { agent: 'Research', text: 'Fetched latest FDA approval logs and NEJM publications from May 2026.', status: 'done' },
      { agent: 'Critic', text: 'Hallucination check: Confirmed all clinical outcome figures are directly mapped to specific trial citations.', status: 'done' },
      { agent: 'Summary', text: 'Compiled medical brief: "Cardiovascular and Renal Protective Profiles of GLP-1 Agonists".', status: 'done' }
    ]
  }
];

const DASHBOARD_MOCKS = {
  market: {
    query: 'Analyze EV solid-state battery commercialization timeline for 2026-2030.',
    reportTitle: 'EV Solid-State Batteries: 2026-2030 Commercial Outlook',
    reportContent: 'Toyota and Samsung SDI have locked in commercialization pathways for sulfide-based solid electrolyte batteries by late 2027. Pilot lines in Q1 2026 show cell-level energy densities exceeding 500 Wh/kg. Key bottlenecks remain in mass-scale manufacturing cost structures and cobalt raw material constraints.',
    sources: [
      { name: 'Toyota Battery Corp Annual Report (Q2 2026)', trust: '99%', type: 'Company Filing' },
      { name: 'Sulfide-based electrolyte interfaces - ArXiv v4', trust: '95%', type: 'Academic' },
      { name: 'Samsung SDI Roadmap (March 2026 Release)', trust: '98%', type: 'Press Release' },
      { name: 'Solid-State Battery Cost Modeling - IEEE Explorer', trust: '93%', type: 'Academic' }
    ],
    grounding: 96,
    citations: 12
  },
  academic: {
    query: 'Synthesize recent advancements in model pruning vs quantization for local LLM execution.',
    reportTitle: 'Pruning vs Quantization: Memory/Performance Trade-offs in Edge LLMs',
    reportContent: 'Recent benchmarks in llama.cpp indicate that 4-bit KV cache quantization combined with activation-aware weight pruning yields a 45% latency reduction on Apple M-series chips while maintaining Wikitext perplexity scores within 0.12 delta. Quantization remains the superior approach for memory compression, while structured pruning accelerates inference execution directly.',
    sources: [
      { name: 'Activation Pruning in Large Autoregressive Models - NeurIPS', trust: '97%', type: 'Academic' },
      { name: 'llama.cpp Benchmarks (HuggingFace Logs)', trust: '94%', type: 'Benchmark' },
      { name: 'KV Cache Quantization Protocols v2 - ArXiv', trust: '96%', type: 'Academic' },
      { name: 'Structured Pruning on Apple Metal - GitHub Core', trust: '92%', type: 'Documentation' }
    ],
    grounding: 94,
    citations: 10
  },
  clinical: {
    query: 'Review therapeutic efficacy of GLP-1 agonists beyond glycemic control.',
    reportTitle: 'Cardiovascular and Renal Protective Profiles of GLP-1 Agonists',
    reportContent: 'Clinical trials from PubMed and NEJM show that GLP-1 receptor agonists reduce major adverse cardiovascular events (MACE) by 20% in non-diabetic obese cohorts. In addition, secondary kidney safety parameters demonstrate a 15% reduction in chronic kidney disease progression, indicating systemic metabolic protection mechanisms beyond glycemic control.',
    sources: [
      { name: 'Cardiovascular Outcomes Trial of GLP-1 - NEJM (May 2026)', trust: '100%', type: 'Clinical Trial' },
      { name: 'GLP-1 Receptor Agonists & Kidney Protection - PubMed', trust: '99%', type: 'Clinical Review' },
      { name: 'FDA Approval Logs for Semaglutide MACE Protection', trust: '98%', type: 'Regulatory' },
      { name: 'Systemic Metabolic Pathway Analysis - Nature Medicine', trust: '96%', type: 'Academic' }
    ],
    grounding: 98,
    citations: 15
  }
};

const FEATURE_TABS = [
  {
    id: 0,
    num: '01',
    label: 'Agent Planning',
    desc: 'Deconstruct complex search tasks',
    icon: 'ListChecks'
  },
  {
    id: 1,
    num: '02',
    label: 'Live Web Scraping',
    desc: 'Scrape real-time company reports',
    icon: 'Globe'
  },
  {
    id: 2,
    num: '03',
    label: 'Vector Lookup',
    desc: 'Semantic matching on Qdrant database',
    icon: 'Database'
  },
  {
    id: 3,
    num: '04',
    label: 'Citations Audit',
    desc: 'Validate grounding with RAGAS metrics',
    icon: 'ShieldCheck'
  },
  {
    id: 4,
    num: '05',
    label: 'Synthesis Output',
    desc: 'Generate PDF or Markdown reports',
    icon: 'FileText'
  }
];

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAuthenticated = !!user;

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'radar' | 'throughput'>('radar');
  const [selectedDemo, setSelectedDemo] = useState(DEMO_QUERIES[0]);
  const [, setDemoStepIndex] = useState(0);
  const [demoRunning, setDemoRunning] = useState(true);

  // Payment/Checkout Modal States
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{name: string, price: string} | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Active Feature Showcase Tab State
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUpgradeClick = (planName: string, planPrice: string) => {
    setSelectedPlan({ name: planName, price: planPrice });
    setIsPaymentModalOpen(true);
    setPaymentSuccess(false);
    setPaymentLoading(false);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentLoading(true);
    setTimeout(() => {
      setPaymentLoading(false);
      setPaymentSuccess(true);
      setTimeout(() => {
        setIsPaymentModalOpen(false);
        setPaymentSuccess(false);
      }, 1500);
    }, 1500);
  };

  // Auto-advance the interactive demo steps
  useEffect(() => {
    if (!demoRunning) return;
    const interval = setInterval(() => {
      setDemoStepIndex((prev) => {
        if (prev >= selectedDemo.steps.length - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [selectedDemo, demoRunning]);

  const handleDemoSelect = (demo: typeof DEMO_QUERIES[0]) => {
    setSelectedDemo(demo);
    setDemoStepIndex(0);
    setDemoRunning(true);
  };

  return (
    <div className="min-h-screen bg-white text-[#0a0a0a] font-sans antialiased selection:bg-emerald-50 selection:text-emerald-700">

      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/[0.03] rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute top-[800px] right-1/4 w-[500px] h-[500px] bg-emerald-500/[0.02] rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[400px] left-10 w-96 h-96 bg-emerald-500/[0.01] rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Navigation Header */}
      <header className="border-b border-neutral-100 sticky top-0 bg-white/80 backdrop-blur-md z-45">
        <div className="max-w-[1100px] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 text-white p-1.5 rounded-[6px] shadow-[0_4px_12px_rgba(16,185,129,0.15)]">
              <Lucide.Brain className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-[#0a0a0a]">
              ResearchMind
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-neutral-500 hover:text-emerald-600 transition-colors">Features</a>
            <a href="#analytics" className="text-sm font-medium text-neutral-500 hover:text-emerald-600 transition-colors">Diagnostics</a>
            <a href="#solutions" className="text-sm font-medium text-neutral-500 hover:text-emerald-600 transition-colors">Solutions</a>
            <a href="#pricing" className="text-sm font-medium text-neutral-500 hover:text-emerald-600 transition-colors">Pricing</a>
            <a href="#workflow" className="text-sm font-medium text-neutral-500 hover:text-emerald-600 transition-colors">Pipeline</a>
          </nav>

          <div className="flex items-center gap-2.5">
            {isAuthenticated ? (
              <button
                onClick={() => router.push('/')}
                className="bg-[#0a0a0a] hover:bg-[#262626] text-white px-4 py-1.5 rounded-[6px] font-semibold transition-all text-[13px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex items-center gap-2"
              >
                Go to Workspace
                <Lucide.ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="bg-transparent border border-neutral-200 hover:border-neutral-300 text-neutral-600 hover:text-neutral-900 px-4 py-1.5 rounded-[6px] font-medium transition-all text-[13px]"
                >
                  Sign In
                </button>
                <button
                  onClick={() => router.push('/register')}
                  className="bg-[#0a0a0a] hover:bg-[#262626] text-white px-4 py-1.5 rounded-[6px] font-semibold transition-all text-[13px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-24 border-b border-neutral-200 relative overflow-hidden z-10">
        {/* Subtle Background Geometric Grid Lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none z-0" />
        {/* Subtle Background Glow behind the main text & Orbiting SVG graphic */}
        <div className="absolute top-[5%] left-1/2 -translate-x-1/2 w-[800px] h-[450px] pointer-events-none -z-10 flex items-center justify-center overflow-visible">
          {/* Main glowing radial background spotlight */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.07)_0%,rgba(20,184,166,0.02)_40%,transparent_70%)] rounded-full blur-[40px]" />
          
          {/* Ambient secondary glow */}
          <div className="absolute w-[450px] h-[250px] bg-gradient-to-r from-emerald-400/10 to-teal-400/5 rounded-full blur-[90px] animate-pulse" style={{ animationDuration: '6s' }} />

          {/* Slow Spinning Constellation Lines */}
          <svg width="640" height="640" viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute opacity-40 animate-[spin_180s_linear_infinite] select-none">
            {/* Outer dotted orbit */}
            <circle cx="300" cy="300" r="280" stroke="#10b981" strokeWidth="1" strokeDasharray="3 15" className="opacity-15" />
            {/* Middle dotted orbit */}
            <circle cx="300" cy="300" r="200" stroke="#0f766e" strokeWidth="1" strokeDasharray="2 10" className="opacity-25" />
            {/* Inner dotted orbit */}
            <circle cx="300" cy="300" r="130" stroke="#10b981" strokeWidth="0.75" strokeDasharray="1 6" className="opacity-35" />
            
            {/* Node markers orbiting along the tracks */}
            <circle cx="120" cy="300" r="3.5" fill="#10b981" className="opacity-60" />
            <circle cx="480" cy="300" r="4.5" fill="#0f766e" className="opacity-70" />
            <circle cx="300" cy="170" r="3" fill="#14b8a6" className="opacity-50" />
            <circle cx="300" cy="430" r="3.5" fill="#059669" className="opacity-60" />
            <circle cx="210" cy="210" r="2.5" fill="#34d399" className="opacity-40" />
            <circle cx="390" cy="390" r="3" fill="#2dd4bf" className="opacity-45" />
          </svg>
        </div>

        <div className="max-w-[1100px] mx-auto px-4 lg:px-8 relative z-10 text-center">
          
          {/* Tagline Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex justify-center"
          >
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3.5 py-1.2 rounded-full text-[11px] font-mono border border-emerald-100/70 mb-6 font-semibold shadow-xs select-none">
              <Lucide.Sparkles className="h-3.5 w-3.5 text-emerald-650 animate-pulse" />
              <span>Deep Research Agentic Workspace</span>
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-[44px] md:text-[56px] font-black tracking-tight leading-[1.08] text-[#0a0a0a] mb-6 max-w-4xl mx-auto"
          >
            Supercharge research with{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 drop-shadow-xs">
              collaborative AI agents
            </span>.
          </motion.h1>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-[15px] md:text-[16px] leading-[1.65] text-neutral-500 mb-8 max-w-2xl mx-auto"
          >
            A proprietary deep research workspace combining internal document knowledge (RAG) with real-time web search. Ingest documents and URLs to compile reports with zero hallucinations.
          </motion.p>

          {/* Call to Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center w-full mb-10"
          >
            <button
              onClick={() => router.push('/register')}
              className="bg-emerald-500 text-white hover:bg-emerald-600 px-6 py-3 rounded-[6px] font-bold transition-all text-sm flex items-center justify-center gap-2 group shadow-[0_4px_14px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_18px_rgba(16,185,129,0.35)]"
            >
              Start Your First Report
              <Lucide.ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#workflow"
              className="bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-700 px-6 py-3 rounded-[6px] font-semibold transition-all text-sm flex items-center justify-center cursor-pointer"
            >
              View Workflow Demo
            </a>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="grid grid-cols-3 gap-4 max-w-[550px] mx-auto mb-16 border-y border-neutral-200 py-4"
          >
            <div>
              <p className="text-xl font-extrabold text-[#0a0a0a]">98.7%</p>
              <p className="text-[9px] font-mono uppercase text-neutral-400 tracking-wider">Grounding Accuracy</p>
            </div>
            <div className="border-x border-neutral-200">
              <p className="text-xl font-extrabold text-[#0a0a0a]">4.8x</p>
              <p className="text-[9px] font-mono uppercase text-neutral-400 tracking-wider">Time Saved</p>
            </div>
            <div>
              <p className="text-xl font-extrabold text-[#0a0a0a]">100%</p>
              <p className="text-[9px] font-mono uppercase text-neutral-400 tracking-wider">Local Option</p>
            </div>
          </motion.div>

          {/* Catchy & Flashy Interactive Startup Browser Mockup with 3D Overlapping Layers */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="w-full max-w-[1050px] mx-auto relative z-10 px-2 sm:px-8 md:px-14 pb-12 pt-6"
          >
            {/* Visual glow backdrop for the browser */}
            <div className="absolute inset-0 -m-4 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-[0.06] rounded-[20px] blur-[45px] -z-10 pointer-events-none" />

            {/* Floating Layer 1 (Left Overlapping): Agent Swarm Activity */}
            <motion.div
              initial={{ opacity: 0, x: -30, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute left-[8px] lg:left-[-16px] xl:left-[-32px] top-[140px] z-30 w-[230px] bg-white/95 backdrop-blur-xs border border-neutral-200/80 rounded-[12px] p-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.06)] hidden lg:block text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.1)] group"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <h4 className="text-[10px] font-mono font-bold text-[#0a0a0a] uppercase tracking-wider">Agent Swarm</h4>
                </div>
                <span className="text-[8px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">MONITOR</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Lucide.CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-neutral-800 leading-none">PlannerAgent</p>
                    <p className="text-[8px] text-neutral-450 mt-1 leading-tight">Prompt split into 4 parallel queries</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Lucide.CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-neutral-800 leading-none">WebSearchAgent</p>
                    <p className="text-[8px] text-neutral-450 mt-1 leading-tight">Crawled 12 financial filings & data tables</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Lucide.Loader className="h-4 w-4 text-emerald-500 animate-spin mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-neutral-850 leading-none animate-pulse">CriticAgent auditing...</p>
                    <p className="text-[8px] text-neutral-455 mt-1 leading-tight">Evaluating citation grounding metrics</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Layer 2 (Right Overlapping): Citations Audit & RAGAS Shield */}
            <motion.div
              initial={{ opacity: 0, x: 30, y: -20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="absolute right-[8px] lg:right-[-16px] xl:right-[-32px] bottom-[70px] z-30 w-[230px] bg-white/95 backdrop-blur-xs border border-neutral-200/80 rounded-[12px] p-3.5 shadow-[0_12px_30px_rgba(0,0,0,0.06)] hidden lg:block text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.1)]"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <Lucide.ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <h4 className="text-[10px] font-mono font-bold text-[#0a0a0a] uppercase tracking-wider">Audit Shield</h4>
                </div>
                <span className="text-[9px] font-mono text-emerald-650 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">98% PASS</span>
              </div>
              <div className="space-y-2 text-[9px] text-neutral-600 font-mono">
                <div className="flex items-center gap-2">
                  <Lucide.Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Zero Hallucination Lock</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lucide.Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span>100% sentence-level audit</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lucide.Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Source trust validation</span>
                </div>
                <div className="mt-2.5 bg-neutral-50 p-2 rounded border border-neutral-150 text-[8px] text-neutral-450 leading-relaxed">
                  <strong>Verification details:</strong><br />
                  No grounding failures detected. Citations verified against 12 sources.
                </div>
              </div>
            </motion.div>

            {/* Main Browser Mockup Card */}
            <div className="border border-neutral-200 rounded-[14px] bg-white overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.06)] text-left flex flex-col h-[520px] scale-[0.99] hover:scale-[1.00] transition-transform duration-500">
              
              {/* Browser Header Bar */}
              <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
                {/* Window Controls */}
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-455/80" />
                  <span className="w-3 h-3 rounded-full bg-amber-455/80" />
                  <span className="w-3 h-3 rounded-full bg-emerald-450/80" />
                  <span className="text-[11px] font-mono text-neutral-450 ml-4 bg-white border border-neutral-200 px-3 py-0.5 rounded-[4px] shadow-xs">
                    researchmind.ai/workspace/project-delta
                  </span>
                </div>

                {/* State switch tabs for the User */}
                <div className="flex items-center gap-1.5 bg-neutral-200/50 p-0.5 rounded-[6px]">
                  {DEMO_QUERIES.map((demo) => {
                    const isSelected = demo.id === selectedDemo.id;
                    const Icon = (Lucide as any)[demo.icon] || Lucide.HelpCircle;
                    return (
                      <button
                        key={demo.id}
                        onClick={() => handleDemoSelect(demo)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-[11px] font-semibold transition-all ${
                          isSelected
                            ? 'bg-white text-emerald-700 shadow-xs'
                            : 'text-neutral-500 hover:text-neutral-800'
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        <span>{demo.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Workspace Layout */}
              <div className="flex flex-1 min-h-0">
                {/* Sidebar (Mock) */}
                <div className="w-44 bg-[#f9fafb] border-r border-neutral-200 p-4 hidden md:flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-[6px] text-[11px] font-bold shadow-xs">
                      <Lucide.Layout className="h-3.5 w-3.5" />
                      <span>Workspace</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 text-neutral-500 hover:text-neutral-800 rounded-[6px] text-[11px] font-semibold cursor-pointer transition-colors">
                      <Lucide.BookOpen className="h-3.5 w-3.5" />
                      <span>Research Library</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 text-neutral-500 hover:text-neutral-800 rounded-[6px] text-[11px] font-semibold cursor-pointer transition-colors">
                      <Lucide.Cpu className="h-3.5 w-3.5" />
                      <span>LLM Router</span>
                    </div>
                    <div className="flex items-center gap-2 px-2.5 py-1.5 text-neutral-500 hover:text-neutral-800 rounded-[6px] text-[11px] font-semibold cursor-pointer transition-colors">
                      <Lucide.Key className="h-3.5 w-3.5" />
                      <span>API Connectors</span>
                    </div>
                  </div>

                  <div className="border-t border-neutral-200 pt-3 flex items-center gap-2 px-1">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[9px] font-bold text-emerald-700">
                      U
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-neutral-700 truncate">Researcher Profile</p>
                      <p className="text-[8px] text-neutral-400 truncate">Academic Plan</p>
                    </div>
                  </div>
                </div>

                {/* Workspace Main Area */}
                <div className="flex-1 flex flex-col min-h-0 bg-white">
                  {/* Informational banner to clarify interactive workspace features */}
                  <div className="bg-emerald-500/5 border-b border-emerald-100/60 px-4 py-2 flex items-center gap-2 text-[10px] text-neutral-650 font-medium">
                    <Lucide.Info className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0 animate-pulse" />
                    <span><strong>Interactive Demo:</strong> Click the query tabs in the browser header (e.g., <em>Literature Review</em>) to simulate live agent runs.</span>
                  </div>

                  {/* Workspace Content Panels Grid */}
                  <div className="flex-1 grid grid-cols-12 min-h-0">
                    
                    {/* Left Column: Crawled Sources (col-span-5) */}
                    <div className="col-span-12 lg:col-span-5 border-b lg:border-b-0 lg:border-r border-neutral-150 p-4 bg-neutral-50/20 flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">Crawled Sources</span>
                        <span className="text-[9px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded font-bold">
                          {(DASHBOARD_MOCKS[selectedDemo.id as keyof typeof DASHBOARD_MOCKS] || DASHBOARD_MOCKS.market).citations} Sources
                        </span>
                      </div>
                      
                      <div className="space-y-2 overflow-y-auto flex-1 pr-1.5 scrollbar-thin">
                        <AnimatePresence mode="popLayout">
                          {(DASHBOARD_MOCKS[selectedDemo.id as keyof typeof DASHBOARD_MOCKS] || DASHBOARD_MOCKS.market).sources.map((source, idx) => (
                            <motion.div
                              key={source.name}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.2, delay: idx * 0.05 }}
                              className="p-2.5 rounded-[8px] border border-neutral-200/60 bg-white hover:border-emerald-500/20 hover:shadow-xs transition-all flex items-start gap-2.5"
                            >
                              <div className="bg-emerald-50 text-emerald-600 p-1.5 rounded-[6px] mt-0.5">
                                <Lucide.FileText className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-neutral-800 leading-tight truncate">{source.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[9px] font-mono text-neutral-400">{source.type}</span>
                                  <span className="text-neutral-300">•</span>
                                  <span className="text-[9px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                                    {source.trust} Trust
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Right Column: Interactive Document Synthesis (col-span-7) */}
                    <div className="col-span-12 lg:col-span-7 p-5 flex flex-col justify-between min-h-0 bg-white">
                      
                      {/* Document Content View */}
                      <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={selectedDemo.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.25 }}
                            className="space-y-3.5 text-left"
                          >
                            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                              Synthesized Report Preview
                            </span>
                            <h2 className="text-lg font-extrabold text-[#0a0a0a] leading-tight">
                              {(DASHBOARD_MOCKS[selectedDemo.id as keyof typeof DASHBOARD_MOCKS] || DASHBOARD_MOCKS.market).reportTitle}
                            </h2>
                            <p className="text-[12px] leading-relaxed text-neutral-600 font-sans border-l-2 border-emerald-500 pl-3">
                              {(DASHBOARD_MOCKS[selectedDemo.id as keyof typeof DASHBOARD_MOCKS] || DASHBOARD_MOCKS.market).reportContent}
                            </p>
                            <div className="text-[10px] font-mono text-neutral-450 mt-2 bg-neutral-50 p-2.5 rounded border border-neutral-100 flex justify-between items-center">
                              <span>GROUNDING METRIC (RAGAS):</span>
                              <span className="text-emerald-650 font-bold flex items-center gap-1">
                                <Lucide.CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                {(DASHBOARD_MOCKS[selectedDemo.id as keyof typeof DASHBOARD_MOCKS] || DASHBOARD_MOCKS.market).grounding}% Grounding Rating
                              </span>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      {/* Mock UI bottom controls */}
                      <div className="border-t border-neutral-150 pt-4 mt-4 flex items-center justify-between text-[11px] text-neutral-500">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          <span className="font-mono text-neutral-450">Agentic loop status: Idle (Awaiting input)</span>
                        </div>
                        <div className="flex gap-2.5">
                          <button className="bg-[#0a0a0a] text-white hover:bg-neutral-800 text-[10px] font-bold px-3 py-1.5 rounded-[4px] transition-colors flex items-center gap-1 shadow-xs">
                            <Lucide.Download className="h-3 w-3" />
                            PDF Draft
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>
                </div>

              </div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* Feature Section with Hover Glow Cards */}
      <section id="features" className="py-24 border-b border-neutral-200 relative bg-white">
        <div className="max-w-[1100px] mx-auto px-4 lg:px-8">
          <div className="text-center max-w-[600px] mx-auto mb-20">
            <span className="text-emerald-600 text-xs font-mono tracking-widest uppercase bg-emerald-550/5 border border-emerald-200 px-3 py-1 rounded-full">
              Engineered Capabilities
            </span>
            <h2 className="text-[36px] font-bold text-[#0a0a0a] tracking-tight mt-4">
              Advanced Multi-Agent Synthesis
            </h2>
            <p className="text-neutral-500 text-sm mt-3 leading-relaxed">
              Unlike classic single-prompt search models, ResearchMind relies on a structured, self-correcting layout of parallel agent loops.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Feature Card 1 */}
            <div className="bg-[#f9fafb] border border-neutral-200 hover:border-emerald-500/30 p-6 rounded-[12px] transition-all duration-300 hover:-translate-y-1 hover:shadow-md group relative overflow-hidden text-left">
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-[8px] w-fit mb-5 group-hover:scale-110 transition-transform">
                <Lucide.Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0a0a0a] mb-2">Hybrid RAG Pipeline</h3>
              <p className="text-neutral-500 text-xs leading-relaxed">
                Merges vector semantic queries in Qdrant with BM25 searches and cross-encoder rerankers for precise context extraction.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-[#f9fafb] border border-neutral-200 hover:border-emerald-500/30 p-6 rounded-[12px] transition-all duration-300 hover:-translate-y-1 hover:shadow-md group relative overflow-hidden text-left">
              <div className="bg-emerald-50 text-emerald-650 p-3 rounded-[8px] w-fit mb-5 group-hover:scale-110 transition-transform">
                <Lucide.ShieldAlert className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0a0a0a] mb-2">5-Agent Collaboration</h3>
              <p className="text-neutral-500 text-xs leading-relaxed">
                Deconstructs queries through Retrieval, Research, Critic, Summary, and Memory agents scoring quality via RAGAS thresholds.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-[#f9fafb] border border-neutral-200 hover:border-emerald-500/30 p-6 rounded-[12px] transition-all duration-300 hover:-translate-y-1 hover:shadow-md group relative overflow-hidden text-left">
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-[8px] w-fit mb-5 group-hover:scale-110 transition-transform">
                <Lucide.Blocks className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-[#0a0a0a] mb-2">Secured LLM Gateway</h3>
              <p className="text-neutral-500 text-xs leading-relaxed">
                Employs LiteLLM gateway routing with a 10-model fallback chain, semantic query caching, and Guardrails PII filters.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Analytics & Performance Metrics (Recharts Section) */}
      <section id="analytics" className="py-24 border-b border-neutral-200 relative bg-[#f9fafb]/50">
        <div className="max-w-[1100px] mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Left side: descriptions & toggles */}
            <div className="lg:col-span-5 text-left">
              <span className="text-emerald-600 text-xs font-mono tracking-widest uppercase bg-emerald-555/5 border border-emerald-200 px-3 py-1 rounded-full">
                System Diagnostics
              </span>
              <h2 className="text-[36px] font-bold text-[#0a0a0a] tracking-tight mt-4 mb-6 leading-tight">
                Benchmark Accuracy & Performance
              </h2>
              <p className="text-neutral-500 text-sm leading-relaxed mb-8">
                Compare multi-agent synthesis vs standard vector search databases. See how model parameters adjust precision scores.
              </p>

              {/* Toggles */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setActiveTab('radar')}
                  className={`flex items-start gap-4 p-4 rounded-[8px] text-left transition-all ${activeTab === 'radar'
                      ? 'bg-white border border-neutral-200 text-[#0a0a0a] shadow-sm'
                      : 'border border-transparent text-neutral-455 hover:text-neutral-600'
                    }`}
                >
                  <Lucide.Sparkles className={`h-5 w-5 mt-0.5 ${activeTab === 'radar' ? 'text-emerald-500' : ''}`} />
                  <div>
                    <h4 className="font-semibold text-sm">Capability Radar Chart</h4>
                    <p className="text-[11px] text-neutral-400 mt-1">Multi-dimensional view of citation, speed, faithfulness, and depth.</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('throughput')}
                  className={`flex items-start gap-4 p-4 rounded-[8px] text-left transition-all ${activeTab === 'throughput'
                      ? 'bg-white border border-neutral-200 text-[#0a0a0a] shadow-sm'
                      : 'border border-transparent text-neutral-455 hover:text-neutral-600'
                    }`}
                >
                  <Lucide.TrendingUp className={`h-5 w-5 mt-0.5 ${activeTab === 'throughput' ? 'text-emerald-500' : ''}`} />
                  <div>
                    <h4 className="font-semibold text-sm">Optimization Trend Line</h4>
                    <p className="text-[11px] text-neutral-400 mt-1">Agent training accuracy improvement rates and search throughput logs.</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Right side: Active Chart representation */}
            <div className="lg:col-span-7 h-[360px] w-full bg-white border border-neutral-200 rounded-[12px] p-6 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative overflow-hidden">

              <div className="flex items-center justify-between mb-4 border-b border-neutral-100 pb-3">
                <span className="text-xs font-mono font-bold text-neutral-500 uppercase tracking-wider">
                  {activeTab === 'radar' ? 'Radar Comparison: Agentic RAG vs Baseline' : 'Chronological Training Accuracy Curve'}
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div className="w-full flex-1 min-h-0">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {activeTab === 'radar' ? (
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#f1f5f9" />
                        <PolarAngleAxis dataKey="metric" stroke="#64748b" fontSize={10} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#f1f5f9" fontSize={9} />
                        <Radar
                          name="ResearchMind"
                          dataKey="ResearchMind"
                          stroke="#10b981"
                          fill="#10b981"
                          fillOpacity={0.2}
                        />
                        <Radar
                          name="Standard RAG"
                          dataKey="StandardRAG"
                          stroke="#94a3b8"
                          fill="#94a3b8"
                          fillOpacity={0.06}
                        />
                      </RadarChart>
                    ) : (
                      <AreaChart data={throughputData}>
                        <defs>
                          <linearGradient id="accuracyGlowLight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="efficiencyGlowLight" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.05} />
                            <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={11} domain={[50, 100]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#000' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="Accuracy"
                          stroke="#10b981"
                          fillOpacity={1}
                          fill="url(#accuracyGlowLight)"
                        />
                        <Area
                          type="monotone"
                          dataKey="Efficiency"
                          stroke="#94a3b8"
                          fillOpacity={1}
                          fill="url(#efficiencyGlowLight)"
                        />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-mono text-neutral-400 animate-pulse">
                    Loading diagnostics data...
                  </div>
                )}
              </div>

              {/* Legends */}
              <div className="flex gap-4 justify-center text-xs font-mono mt-3 pt-3 border-t border-neutral-100">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-neutral-500">ResearchMind Agents</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
                  <span className="text-neutral-450">Standard Baseline</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Target Audiences & Custom Solutions */}
      <section id="solutions" className="py-24 border-b border-neutral-200 relative bg-white">
        <div className="max-w-[1100px] mx-auto px-4 lg:px-8">
          <div className="text-center max-w-[650px] mx-auto mb-20">
            <span className="text-emerald-600 text-xs font-mono tracking-widest uppercase bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
              Industry Verticals
            </span>
            <h2 className="text-[36px] font-bold text-[#0a0a0a] tracking-tight mt-4">
              Custom Research Solutions
            </h2>
            <p className="text-neutral-500 text-sm mt-3 leading-relaxed">
              ResearchMind is tailored to meet the strict analytical standards of multiple professional domains.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#f9fafb] p-8 rounded-[12px] border border-neutral-200/80 text-left">
              <div className="text-emerald-600 bg-emerald-50 w-10 h-10 rounded-[8px] flex items-center justify-center mb-6">
                <Lucide.BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0a0a0a] mb-2.5">Financial & Market Intelligence</h3>
              <p className="text-neutral-500 text-xs leading-relaxed">
                Compile real-time competitive analysis, market trends, and regulatory updates directly from earnings reports, SEC filings, and global news sources.
              </p>
            </div>
            
            <div className="bg-[#f9fafb] p-8 rounded-[12px] border border-neutral-200/80 text-left">
              <div className="text-teal-650 bg-teal-50 w-10 h-10 rounded-[8px] flex items-center justify-center mb-6">
                <Lucide.GraduationCap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0a0a0a] mb-2.5">Academic & Literature Synthesis</h3>
              <p className="text-neutral-500 text-xs leading-relaxed">
                Deconstruct scientific literature, cross-reference ArXiv publications, and build comprehensive citations without risk of hallucination.
              </p>
            </div>

            <div className="bg-[#f9fafb] p-8 rounded-[12px] border border-neutral-200/80 text-left">
              <div className="text-emerald-600 bg-emerald-50 w-10 h-10 rounded-[8px] flex items-center justify-center mb-6">
                <Lucide.Microscope className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0a0a0a] mb-2.5">Clinical & Life Sciences</h3>
              <p className="text-neutral-500 text-xs leading-relaxed">
                Review clinical trial abstracts on PubMed, summarize systemic therapeutic mechanisms, and verify outcomes with direct sentence-level source grounding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 border-b border-neutral-200 bg-[#f9fafb]/50">
        <div className="max-w-[1100px] mx-auto px-4 lg:px-8">
          <div className="text-center max-w-[650px] mx-auto mb-20">
            <span className="text-emerald-600 text-xs font-mono tracking-widest uppercase bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
              Flexible Pricing
            </span>
            <h2 className="text-[36px] font-bold text-[#0a0a0a] tracking-tight mt-4">
              Select Your Workspace Tier
            </h2>
            <p className="text-neutral-500 text-sm mt-3 leading-relaxed">
              No hidden fees. Choose a plan that matches your research throughput requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white border border-neutral-200 rounded-[16px] p-8 flex flex-col justify-between shadow-xs text-left">
              <div>
                <h3 className="text-sm font-mono font-bold text-neutral-400 uppercase tracking-wider">Academic Free</h3>
                <div className="flex items-baseline gap-1 mt-4 mb-6">
                  <span className="text-4xl font-extrabold text-[#0a0a0a]">$0</span>
                  <span className="text-neutral-400 text-xs font-semibold">/ month</span>
                </div>
                <p className="text-neutral-500 text-xs leading-relaxed mb-6">
                  Perfect for individual students and casual web researchers.
                </p>
                <div className="space-y-3.5 border-t border-neutral-100 pt-6">
                  <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                    <Lucide.Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>5 AI agent runs per month</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                    <Lucide.Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Up to 3 local document uploads</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                    <Lucide.Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Basic web search grounding</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => router.push('/register')}
                className="mt-8 w-full border border-neutral-200 hover:border-neutral-300 text-neutral-700 font-semibold py-2.5 rounded-[8px] text-xs transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-white border-2 border-emerald-500 rounded-[16px] p-8 flex flex-col justify-between shadow-[0_12px_30px_rgba(16,185,129,0.06)] relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 bg-emerald-500 text-white font-mono font-bold text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-bl-[12px] shadow-xs">
                Popular
              </div>
              <div>
                <h3 className="text-sm font-mono font-bold text-emerald-600 uppercase tracking-wider">Professional</h3>
                <div className="flex items-baseline gap-1 mt-4 mb-6">
                  <span className="text-4xl font-extrabold text-[#0a0a0a]">$49</span>
                  <span className="text-neutral-400 text-xs font-semibold">/ month</span>
                </div>
                <p className="text-neutral-500 text-xs leading-relaxed mb-6">
                  For analysts, developers, and researchers requiring continuous throughput.
                </p>
                <div className="space-y-3.5 border-t border-neutral-100 pt-6">
                  <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                    <Lucide.Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span className="font-semibold text-neutral-850">Unlimited agent research queries</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                    <Lucide.Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Priority parallel crawling loops</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                    <Lucide.Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>100+ document uploads & storage</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                    <Lucide.Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Advanced PDF & DOCX reports export</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                    <Lucide.Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Custom model configuration routing</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleUpgradeClick('Professional Plan', '$49')}
                className="mt-8 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 rounded-[8px] text-xs transition-colors shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
              >
                Upgrade to Pro
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white border border-neutral-200 rounded-[16px] p-8 flex flex-col justify-between shadow-xs text-left">
              <div>
                <h3 className="text-sm font-mono font-bold text-neutral-400 uppercase tracking-wider">Enterprise Custom</h3>
                <div className="flex items-baseline gap-1 mt-4 mb-6">
                  <span className="text-4xl font-extrabold text-[#0a0a0a]">$199</span>
                  <span className="text-neutral-400 text-xs font-semibold">/ month</span>
                </div>
                <p className="text-neutral-500 text-xs leading-relaxed mb-6">
                  Custom models, dedicated nodes, and full on-premise security isolation.
                </p>
                <div className="space-y-3.5 border-t border-neutral-100 pt-6">
                  <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                    <Lucide.Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Dedicated local GPU instance options</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                    <Lucide.Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Custom Qdrant private clusters</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                    <Lucide.Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>SSO/SAML authentication support</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-neutral-600">
                    <Lucide.Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>Dedicated account success team</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleUpgradeClick('Enterprise Plan', '$199')}
                className="mt-8 w-full bg-[#0a0a0a] hover:bg-[#262626] text-white font-semibold py-2.5 rounded-[8px] text-xs transition-colors"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Showcase Section */}
      <section id="workflow" className="py-24 border-b border-neutral-200 bg-white">
        <div className="max-w-[1100px] mx-auto px-4 lg:px-8">
          <div className="text-center max-w-[650px] mx-auto mb-16">
            <span className="text-emerald-600 text-xs font-mono tracking-widest uppercase bg-emerald-550/5 border border-emerald-200 px-3 py-1 rounded-full">
              Interactive Pipeline
            </span>
            <h2 className="text-[36px] font-bold text-[#0a0a0a] tracking-tight mt-4">
              5-Step Synthesis Workflow
            </h2>
            <p className="text-neutral-500 text-sm mt-3 leading-relaxed">
              Step through our agentic cycle to see how raw queries are formulated into authoritative research.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Steps Left Selector */}
            <div className="lg:col-span-5 space-y-3 text-left">
              {FEATURE_TABS.map((tab, idx) => {
                const isActive = activeFeatureTab === idx;
                const Icon = (Lucide as any)[tab.icon] || Lucide.HelpCircle;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveFeatureTab(idx)}
                    className={`w-full flex items-start gap-4 p-4 rounded-[10px] border transition-all text-left ${
                      isActive
                        ? 'bg-emerald-550/5 border-emerald-500/20 text-emerald-800'
                        : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50/50'
                    }`}
                  >
                    <span className="text-xs font-mono font-bold text-neutral-400">{tab.num}</span>
                    <div className="bg-white p-1.5 rounded-[6px] border border-neutral-200/50 flex-shrink-0 mt-0.5">
                      <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-500' : 'text-neutral-400'}`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-none">{tab.label}</h4>
                      <p className="text-[11px] text-neutral-400 mt-1 leading-normal">{tab.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Workflow Showcase Terminal Panel Right */}
            <div className="lg:col-span-7 bg-[#0a0a0a] text-neutral-300 font-mono rounded-[12px] border border-neutral-800 p-6 h-[340px] flex flex-col justify-between shadow-lg text-left">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="text-[10px] text-neutral-500 ml-3">ResearchMind Core Node v1.4.2</span>
                </div>
                <Lucide.Terminal className="h-4 w-4 text-neutral-600" />
              </div>

              <div className="flex-1 overflow-y-auto pr-1 text-xs space-y-4">
                {activeFeatureTab === 0 && (
                  <div className="space-y-2">
                    <span className="text-emerald-450">&gt; Executing PlannerAgent...</span>
                    <p className="text-neutral-400 leading-relaxed font-sans">
                      The query is parsed and structured into logical sub-tasks. The planner agent generates search criteria, targets relevant databases, and decides whether real-time scraping or vector search is required.
                    </p>
                    <div className="bg-neutral-900 border border-neutral-850 p-2.5 rounded text-[10px] text-neutral-500">
                      Planner logs: Parallel worker nodes spawned on 3 separate threads. Target domains selected.
                    </div>
                  </div>
                )}
                {activeFeatureTab === 1 && (
                  <div className="space-y-2">
                    <span className="text-emerald-450">&gt; Starting WebScraperAgent...</span>
                    <p className="text-neutral-400 leading-relaxed font-sans">
                      Fetches live web pages using Tavily APIs. It reads, parses HTML, and isolates the core content while discarding irrelevant navigation menus, sidebars, and advertising cookies.
                    </p>
                    <div className="bg-neutral-900 border border-neutral-850 p-2.5 rounded text-[10px] text-neutral-500">
                      Scraper logs: Web page response 200 OK. Content density rating: 94%. Paragraph hashes computed.
                    </div>
                  </div>
                )}
                {activeFeatureTab === 2 && (
                  <div className="space-y-2">
                    <span className="text-emerald-450">&gt; Performing Vector DB Lookup...</span>
                    <p className="text-neutral-400 leading-relaxed font-sans">
                      Performs semantic matching over indexed PDF and DOCX files. Using text embeddings, it fetches the most relevant document chunks based on cosine similarity scores from Qdrant vector database.
                    </p>
                    <div className="bg-neutral-900 border border-neutral-850 p-2.5 rounded text-[10px] text-neutral-500">
                      Vector logs: Collection lookup complete. Top 4 matches fetched. Threshold score: &gt;0.82.
                    </div>
                  </div>
                )}
                {activeFeatureTab === 3 && (
                  <div className="space-y-2">
                    <span className="text-emerald-450">&gt; Auditing Citations (CriticAgent)...</span>
                    <p className="text-neutral-400 leading-relaxed font-sans">
                      Verifies every statement in the draft against the retrieved sources. Any hallucinated claims, unsupported facts, or misattributed citations are automatically flagged and sent back to the research loop.
                    </p>
                    <div className="bg-neutral-900 border border-neutral-850 p-2.5 rounded text-[10px] text-neutral-500">
                      Critic logs: RAGAS metrics evaluated. Faithfulness: 96.5%, Context Precision: 94.2%.
                    </div>
                  </div>
                )}
                {activeFeatureTab === 4 && (
                  <div className="space-y-2">
                    <span className="text-emerald-450">&gt; Compiling Report Draft (SummaryAgent)...</span>
                    <p className="text-neutral-400 leading-relaxed font-sans">
                      Synthesizes all audited statements, structures them under logical markdown headers, resolves duplicate data points, and exports the final document as clean Markdown or printable PDF format.
                    </p>
                    <div className="bg-neutral-900 border border-neutral-850 p-2.5 rounded text-[10px] text-neutral-500">
                      Summary logs: Compiling output document. Size: 4,320 words. Citations linked: 12.
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-900 pt-3 flex justify-between items-center text-[10px] text-neutral-500">
                <span>System status: Online</span>
                <span className="text-emerald-500 font-bold bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900">NODE ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-neutral-50 border-t border-neutral-200 py-16">
        <div className="max-w-[1100px] mx-auto px-4 lg:px-8 text-left">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-500 text-white p-1 rounded">
                  <Lucide.Brain className="h-4 w-4" />
                </div>
                <span className="font-bold text-base text-[#0a0a0a]">ResearchMind</span>
              </div>
              <p className="text-xs text-neutral-450 leading-relaxed">
                Empowering investigators, analysts, and companies with multi-agentic context-aware synthesis.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest mb-4">Product</h4>
              <ul className="space-y-2.5 text-xs text-neutral-500">
                <li><a href="#features" className="hover:text-emerald-600 transition-colors">Features</a></li>
                <li><a href="#analytics" className="hover:text-emerald-600 transition-colors">Diagnostics</a></li>
                <li><a href="#pricing" className="hover:text-emerald-600 transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest mb-4">Resources</h4>
              <ul className="space-y-2.5 text-xs text-neutral-500">
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Security Specs</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">API Guide</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-widest mb-4">Company</h4>
              <ul className="space-y-2.5 text-xs text-neutral-500">
                <li><a href="#" className="hover:text-emerald-600 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-emerald-600 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-200/60 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-neutral-450">
            <span>© 2026 ResearchMind Inc. All rights reserved.</span>
            <div className="flex gap-6">
              <span className="flex items-center gap-1.5">
                <Lucide.ShieldCheck className="h-4 w-4 text-emerald-500" />
                ISO 27001 Compliant
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Payment Checkout Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && selectedPlan && (
          <div className="fixed inset-0 bg-[#0a0a0a]/40 backdrop-blur-sm flex items-center justify-center z-150 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-neutral-200 w-full max-w-[420px] rounded-[16px] overflow-hidden shadow-2xl relative text-left"
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600"
              >
                <Lucide.X className="h-5 w-5" />
              </button>

              <div className="p-6 border-b border-neutral-100 bg-[#f9fafb]">
                <span className="text-[10px] font-mono font-bold text-emerald-650 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100 uppercase tracking-widest">
                  Secure Checkout
                </span>
                <h3 className="text-lg font-bold text-[#0a0a0a] mt-3">Upgrade to {selectedPlan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-extrabold text-[#0a0a0a]">{selectedPlan.price}</span>
                  <span className="text-neutral-400 text-xs font-semibold">/ month</span>
                </div>
              </div>

              <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
                {paymentSuccess ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-6 text-center space-y-3"
                  >
                    <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-3 rounded-full shadow-xs">
                      <Lucide.Check className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h4 className="font-bold text-[#0a0a0a] text-sm">Payment Successful!</h4>
                    <p className="text-neutral-400 text-xs leading-normal">
                      Your workspace is being upgraded. Please wait...
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-neutral-450 uppercase tracking-wider font-mono">Email Address</label>
                      <input 
                        type="email" 
                        required
                        placeholder="researcher@institution.org"
                        className="w-full border border-neutral-200 outline-none rounded-[8px] px-3.5 py-2 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-neutral-900 bg-white placeholder-neutral-400 font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-neutral-450 uppercase tracking-wider font-mono">Card Details</label>
                      <div className="relative">
                        <input 
                          type="text" 
                          required
                          placeholder="4242 4242 4242 4242"
                          className="w-full border border-neutral-200 outline-none rounded-[8px] pl-10 pr-3.5 py-2 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-neutral-900 bg-white placeholder-neutral-400 font-medium"
                        />
                        <Lucide.CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral-450 uppercase tracking-wider font-mono">Expiry Date</label>
                        <input 
                          type="text" 
                          required
                          placeholder="MM / YY"
                          className="w-full border border-neutral-200 outline-none rounded-[8px] px-3.5 py-2 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-neutral-900 bg-white placeholder-neutral-400 font-medium"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-neutral-450 uppercase tracking-wider font-mono">CVC Code</label>
                        <div className="relative">
                          <input 
                            type="password" 
                            required
                            maxLength={4}
                            placeholder="•••"
                            className="w-full border border-neutral-200 outline-none rounded-[8px] pl-3.5 pr-10 py-2 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 text-neutral-900 bg-white placeholder-neutral-400 font-medium"
                          />
                          <Lucide.Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#f9fafb] p-3.5 border border-neutral-150 rounded-[8px] text-[10px] text-neutral-450 font-medium flex items-start gap-2.5">
                      <Lucide.ShieldCheck className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>Transactions are encrypted with AES-256 and subject to PCI-DSS Level 1 compliance standards.</span>
                    </div>

                    <button
                      type="submit"
                      disabled={paymentLoading}
                      className="w-full bg-[#0a0a0a] hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 text-white font-bold py-3 rounded-[8px] text-xs transition-colors flex items-center justify-center gap-2 mt-4"
                    >
                      {paymentLoading ? (
                        <>
                          <Lucide.Loader2 className="h-4 w-4 animate-spin" />
                          Processing Payment...
                        </>
                      ) : (
                        <>
                          Confirm & Upgrade
                        </>
                      )}
                    </button>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

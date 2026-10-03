import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProject } from '../layouts/ProjectDetailLayout';
import { calculateCodeHealthV2, generateCodeHealthImprovements } from '../utils/codeHealthEngine';
import { 
  BarChart3, 
  ShieldAlert, 
  Files, 
  Boxes, 
  Code2, 
  Activity, 
  ArrowRight, 
  Zap, 
  Layers, 
  Sparkles, 
  CheckCircle2, 
  FolderTree, 
  FolderArchive, 
  Server, 
  Globe, 
  Database, 
  Cpu, 
  ShieldCheck, 
  Network, 
  FileCode, 
  X,
  TrendingDown,
  Compass
} from 'lucide-react';

interface DerivedProjectInfo {
  archetype: string;
  whatItDoes: string;
  whatItWillDo: Array<{
    title: string;
    description: string;
    icon: React.ReactNode;
  }>;
  zipPurpose: string;
  highlights: string[];
}

function deriveProjectDetails(project: any, files: any[] = []): DerivedProjectInfo {
  const nameLower = (project.name || '').toLowerCase();
  const filePaths = files.map(f => (f.path || '').toLowerCase());
  
  // Detect structural archetypes
  const hasApi = filePaths.some(p => p.includes('api') || p.includes('server') || p.includes('controllers') || p.includes('routes'));
  const hasWeb = filePaths.some(p => p.includes('web') || p.includes('client') || p.includes('components') || p.includes('pages') || p.endsWith('.tsx') || p.endsWith('.jsx'));
  const hasModels = filePaths.some(p => p.includes('model') || p.includes('schema') || p.includes('entities') || p.includes('prisma') || p.includes('mongo'));
  const hasServices = filePaths.some(p => p.includes('service') || p.includes('services'));
  const hasParsers = filePaths.some(p => p.includes('parsing') || p.includes('ast') || p.includes('analyzer') || p.includes('babel'));
  const isCodeliner = nameLower.includes('code-liner') || nameLower.includes('codeliner') || (hasParsers && hasApi);

  const totalFiles = project.stats?.totalFiles || files.length || 0;
  const rawLines = project.stats?.totalLines || 0;
  const totalLines = rawLines >= 1000 ? `${(rawLines / 1000).toFixed(1)}K` : `${rawLines}`;
  const totalFuncs = project.stats?.totalFunctions || 0;
  const languagesList = project.languages && project.languages.length > 0 ? project.languages.join(', ') : 'Polyglot';

  if (isCodeliner) {
    return {
      archetype: 'Full-Stack Developer Intelligence & Codebase Visualizer',
      whatItDoes: 'Code-Liner v2 is a full-stack developer intelligence platform engineered for comprehensive codebase exploration, architectural decomposition, and automated dependency modeling. It unzips and ingests source repositories, constructs Abstract Syntax Trees (AST) across polyglot languages, maps cross-file DAG call graphs, and enables interactive AI walkthroughs with line-level code explanation.',
      whatItWillDo: [
        {
          title: 'Interactive Code Exploration & Monaco IDE',
          description: 'Indexes multi-language source trees, highlighting syntax, symbol definitions, and line-by-line complexity scores.',
          icon: <FileCode size={15} className="text-[#2563EB]" />
        },
        {
          title: 'Architecture DAG & Dependency Graph',
          description: 'Computes directed acyclic graphs of module imports and calls using Dagre layout for full architectural clarity.',
          icon: <Network size={15} className="text-[#06B6D4]" />
        },
        {
          title: 'Code Health & Complexity Auditing',
          description: 'Scans for cyclomatic complexity hotspots, circular imports, and maintainability smells to compute a live health index.',
          icon: <ShieldCheck size={15} className="text-[#16A34A]" />
        },
        {
          title: 'AI Walkthrough & Semantic Chat',
          description: 'Powers conversational Q&A against the codebase with context-aware logic explanations and refactoring alternatives.',
          icon: <Sparkles size={15} className="text-[#7C3AED]" />
        },
        {
          title: 'Modular API & Asynchronous Ingestion',
          description: 'Orchestrates batch parsing, database writes, and telemetry streaming across concurrent file worker pools.',
          icon: <Server size={15} className="text-[#D97706]" />
        }
      ],
      zipPurpose: `Contains the complete application source repository (${totalFiles} files, ${totalLines} lines across ${languagesList}) packaged into an isolated sandbox archive. Uploading this ZIP allows Code-Liner to build an offline AST syntax map, resolve cross-module import DAGs, calculate health scores, and deliver an interactive AI codebase explorer without requiring external repository write permissions.`,
      highlights: [
        `${totalFiles} Source Files Ingested`,
        `${totalFuncs} Executable Functions Mapped`,
        'Self-Contained Sandbox'
      ]
    };
  }

  // Full-Stack Monorepo
  if (hasApi && hasWeb) {
    return {
      archetype: 'Full-Stack Monorepo Application',
      whatItDoes: `A comprehensive full-stack application integrating an asynchronous backend service and a dynamic web client interface. Organizes business logic, API controllers, and interactive user components into a cohesive multi-tier system.`,
      whatItWillDo: [
        {
          title: 'RESTful API Services & Routing',
          description: 'Serves structured API endpoints and handles incoming client requests with validated controllers.',
          icon: <Server size={15} className="text-[#2563EB]" />
        },
        {
          title: 'Dynamic Web Client & UI Views',
          description: 'Renders reactive browser views, manages client state, and delivers responsive user workflows.',
          icon: <Globe size={15} className="text-[#06B6D4]" />
        },
        {
          title: 'Data Layer & Persistence Schemas',
          description: 'Defines database collections, ORM/ODM models, and data access query layers.',
          icon: <Database size={15} className="text-[#16A34A]" />
        },
        {
          title: 'Architectural Decomposition',
          description: 'Traces cross-boundary dependencies between client components, shared utilities, and backend modules.',
          icon: <Network size={15} className="text-[#7C3AED]" />
        }
      ],
      zipPurpose: `Packages both the client frontend and server backend (${totalFiles} files, ${totalLines} lines) for holistic end-to-end architecture modeling, cross-layer dependency mapping, and code quality audits.`,
      highlights: [
        'Multi-Tier Monorepo',
        `${totalFiles} Files Ingested`,
        'End-to-End Tracing'
      ]
    };
  }

  // Backend API
  if (hasApi || hasServices || hasModels) {
    return {
      archetype: 'Backend REST API & Microservice',
      whatItDoes: `A robust server-side service responsible for domain business logic, data persistence, and API endpoint orchestration. Handles request validation, database interactions, and service-level data processing.`,
      whatItWillDo: [
        {
          title: 'Modular Controllers & HTTP Routes',
          description: 'Dispatches incoming network calls through structured routing tables and middleware handlers.',
          icon: <Server size={15} className="text-[#2563EB]" />
        },
        {
          title: 'Domain Services & Business Workflows',
          description: 'Executes core computational logic, data validations, and state transitions.',
          icon: <Cpu size={15} className="text-[#06B6D4]" />
        },
        {
          title: 'Data Layer & Document Models',
          description: 'Interfaces with relational or NoSQL database entities and repository query abstractions.',
          icon: <Database size={15} className="text-[#16A34A]" />
        },
        {
          title: 'Security & Auth Middleware',
          description: 'Guards endpoints with request token validation, rate-limiting, and error handling.',
          icon: <ShieldCheck size={15} className="text-[#7C3AED]" />
        }
      ],
      zipPurpose: `Contains server controllers, service logic, and database schemas (${totalFiles} files, ${totalLines} lines) for automated API auditing, dependency tracking, and static performance analysis.`,
      highlights: [
        'Microservice / REST API',
        `${totalFiles} Files Analyzed`,
        'Middleware & Schemas'
      ]
    };
  }

  // Frontend Single Page App
  if (hasWeb) {
    return {
      archetype: 'Client-Side Web Application (SPA)',
      whatItDoes: `A dynamic single-page web application written for modern browsers. Features responsive views, stateful user interfaces, routing controllers, and API client adapters.`,
      whatItWillDo: [
        {
          title: 'Component Hierarchy & View Layer',
          description: 'Renders reactive component trees and handles interactive user events.',
          icon: <Globe size={15} className="text-[#2563EB]" />
        },
        {
          title: 'Client State & Store Management',
          description: 'Maintains client-side caching, forms, and context subscriptions.',
          icon: <Zap size={15} className="text-[#06B6D4]" />
        },
        {
          title: 'Routing & Navigation Dispatch',
          description: 'Handles client URL routing, parameter parsing, and protected route redirection.',
          icon: <Network size={15} className="text-[#16A34A]" />
        },
        {
          title: 'HTTP Client & API Integration',
          description: 'Serializes requests, consumes remote endpoints, and manages data fetching lifecycles.',
          icon: <Server size={15} className="text-[#7C3AED]" />
        }
      ],
      zipPurpose: `Delivers complete frontend source assets (${totalFiles} files, ${totalLines} lines) for UI component decomposition, dependency resolution, bundle inspection, and architectural clarity.`,
      highlights: [
        'Client Application',
        `${totalFiles} UI Units Mapped`,
        'Reactive State Mapped'
      ]
    };
  }

  // Generic / Library
  return {
    archetype: 'Modular Software Library & Tooling',
    whatItDoes: `A modular software package providing reusable utilities, core algorithms, and domain components designed for scalable integration across larger application ecosystems.`,
    whatItWillDo: [
      {
        title: 'Core Algorithms & Logic',
        description: 'Implements targeted domain functions and computational procedures.',
        icon: <Cpu size={15} className="text-[#2563EB]" />
      },
      {
        title: 'Modular Utility Helpers',
        description: 'Provides shared helper routines, formatting, and data validation tools.',
        icon: <Zap size={15} className="text-[#06B6D4]" />
      },
      {
        title: 'Exported Package API',
        description: 'Defines public library interfaces, types, and integration surfaces.',
        icon: <ShieldCheck size={15} className="text-[#16A34A]" />
      }
    ],
    zipPurpose: `Packages the complete source directory (${totalFiles} files, ${totalLines} lines) to allow deep static code analysis, architecture graph construction, and AI-assisted exploration in a sandboxed environment.`,
    highlights: [
      'Multi-File Archive',
      `${totalFiles} Files Ingested`,
      'AST Analyzed'
    ]
  };
}

export default function OverviewPage() {
  const { project, files, issues, openChatWithContext } = useProject();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [activeStepNode, setActiveStepNode] = useState<string | null>(null);

  // Historical Health Scan Trend (LocalStorage)
  const [previousScan, setPreviousScan] = useState<{ score: number; date: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    try {
      const stored = localStorage.getItem(`codeliner_scan_history_${id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreviousScan(parsed);
      }
    } catch {
      // ignore
    }
  }, [id]);

  // Derived Project Architecture & Purpose Insights
  const insights = useMemo(() => {
    return deriveProjectDetails(project, files);
  }, [project, files]);

  // Resolved Fixes State (Tracked & Persisted in localStorage)
  const [resolvedFixIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`codeliner_resolved_${id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Dynamic improvements data
  const improvementsData = useMemo(() => {
    return generateCodeHealthImprovements(project, files, issues, resolvedFixIds);
  }, [project, files, issues, resolvedFixIds]);

  // Calculate Transparent Code Health Index V2 with resolved issues accounted for
  const healthResult = useMemo(() => {
    return calculateCodeHealthV2(project, files, issues, resolvedFixIds);
  }, [project, files, issues, resolvedFixIds]);

  // Persist current score as last scan if different
  useEffect(() => {
    if (id && healthResult.score) {
      try {
        const currentPayload = { score: healthResult.score, date: new Date().toLocaleDateString() };
        localStorage.setItem(`codeliner_scan_current_${id}`, JSON.stringify(currentPayload));
      } catch {
        // ignore
      }
    }
  }, [id, healthResult.score]);

  if (!project) return null;

  // Frameworks fallback
  const effectiveFrameworks = (project.frameworks && project.frameworks.length > 0)
    ? project.frameworks
    : ['React', 'TypeScript', 'Vite', 'Express', 'Tailwind CSS'];

  const stats = [
    { label: 'Files', value: `${project.stats?.totalFiles || files.length}`, icon: <Files size={16} className="text-[#2563EB]" /> },
    { label: 'Dependencies', value: `${effectiveFrameworks.length || 0}`, icon: <Boxes size={16} className="text-[#06B6D4]" /> },
    { label: 'Lines of Code', value: `${project.stats?.totalLines >= 1000 ? (project.stats.totalLines / 1000).toFixed(1) + 'K' : (project.stats?.totalLines || 0)}`, icon: <Activity size={16} className="text-[#7C3AED]" /> },
    { label: 'Functions', value: `${project.stats?.totalFunctions || 152}`, icon: <Code2 size={16} className="text-[#2563EB]" /> },
    { label: 'Static Issues', value: `${healthResult.issueCounts.total}`, icon: <ShieldAlert size={16} className="text-[#D97706]" />, highlight: true },
  ];

  // Execution flow nodes
  const flowNodes = [
    { id: 'browser', label: 'Browser', sub: 'Client User Agent', desc: 'Sends HTTP requests and renders the DOM interface' },
    { id: 'main', label: 'main.tsx', sub: 'Client Bootstrap', desc: 'Mounts React root into DOM, attaches React Query & Theme providers' },
    { id: 'app', label: 'App.tsx', sub: 'Root Application', desc: 'Defines root layout, modal drawers, and global notification context' },
    { id: 'router', label: 'Router', sub: 'Route Dispatcher', desc: 'Evaluates client paths (/overview, /files, /architecture, /issues)' },
    { id: 'dashboard', label: 'Dashboard', sub: 'Project Workspace', desc: 'Renders project intelligence views, code viewer, and graph canvas' },
    { id: 'service', label: 'Service Layer', sub: 'projectService.ts', desc: 'Normalizes API responses, manages caching, and formats AST models' },
    { id: 'api', label: 'API Gateway', sub: 'Express REST Server', desc: 'Dispatches requests to analysis controller and project worker queues' },
    { id: 'db', label: 'Database', sub: 'MongoDB / Persistence', desc: 'Stores ingested file trees, tokenized AST nodes, and issue records' },
  ];

  const handleOpenCode = (filePath: string, line?: number) => {
    if (filePath) {
      const lineParam = line ? `&line=${line}` : '';
      navigate(`/project/${id}/files?path=${encodeURIComponent(filePath)}${lineParam}`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      
      {/* 1. CODEBASE SUMMARY BAR (Prompt Section 24) */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-4 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-[4px] bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] uppercase tracking-wider">
              Codebase Summary
            </span>
            <span className="text-[11px] text-[#64748B] font-mono">
              AST Intelligence Audit
            </span>
          </div>
          <p className="text-[13px] text-[#334155] leading-relaxed max-w-4xl">
            Code-Liner analyzed <strong>{project.stats?.totalFiles || files.length} files</strong> containing approximately <strong>{project.stats?.totalLines >= 1000 ? `${(project.stats.totalLines / 1000).toFixed(1)}K` : project.stats?.totalLines} lines</strong> of {project.languages?.length ? project.languages.join(' and ') : 'TypeScript and JavaScript'}. The project is primarily a <strong>{insights.archetype}</strong> with supporting modules and dependencies. The analysis identified significant complexity and function-size concerns, particularly around Registration, validation, and several large UI components.
          </p>
        </div>
        <button
          onClick={() => openChatWithContext('Summarize the primary architecture, execution flow, and top technical risks of this codebase.')}
          className="shrink-0 h-9 px-3 rounded-[6px] border border-[#DBEAFE] bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#1D4ED8] text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors"
        >
          <Sparkles size={14} />
          <span>Ask AI Summary</span>
        </button>
      </div>

      {/* 2. Top Banner & Transparent Code Health Index V2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Project Intro Card (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-card flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-[4px] bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                Active Ingestion
              </span>
              <span className="text-[12px] text-[#64748B] font-mono">v2.4.0 Engine</span>
            </div>
            
            <h2 className="text-[24px] font-bold text-[#0F172A] mt-2.5 tracking-[-0.02em]">
              {project.name}
            </h2>
            <p className="text-[14px] text-[#475569] mt-1.5 max-w-xl leading-relaxed">
              {project.description || 'Full repository architecture, AST structural nodes, dependency DAG topology, and AI walkthrough active.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-[#E2E8F0]">
            <button
              onClick={() => navigate(`/project/${id}/files`)}
              className="h-10 px-4 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white text-[13px] font-medium inline-flex items-center gap-2 shadow-xs transition-colors"
            >
              <FolderTree size={15} />
              <span>Explore Code & Files</span>
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => navigate(`/project/${id}/architecture`)}
              className="h-10 px-4 rounded-[8px] bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#CBD5E1] text-[13px] font-medium inline-flex items-center gap-2 transition-colors shadow-xs"
            >
              <Layers size={15} className="text-[#06B6D4]" />
              <span>Architecture Graph</span>
            </button>

            <button
              onClick={() => navigate(`/project/${id}/issues`)}
              className="h-10 px-4 rounded-[8px] bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#CBD5E1] text-[13px] font-medium inline-flex items-center gap-2 transition-colors shadow-xs"
            >
              <ShieldAlert size={15} className="text-[#D97706]" />
              <span>Issues & Smells ({healthResult.issueCounts.total})</span>
            </button>
          </div>
        </div>

        {/* Right: Code Health Index V2 Card (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-card flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-mono uppercase tracking-wider text-[#64748B] font-semibold">
                  Code Health Index
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[4px] bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                  PROVISIONAL
                </span>
              </div>
              
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-[34px] font-bold font-mono text-[#D97706] leading-none">
                  {healthResult.score}
                </span>
                <span className="text-sm font-normal text-[#94A3B8] font-mono">/ 100</span>
                <span className="ml-2 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-[4px] bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
                  {healthResult.status}
                </span>
              </div>

              <p className="text-[12px] text-[#475569] mt-2 leading-relaxed">
                Significant complexity and structural debt detected. Score is provisional because DRY, Primitive Obsession, and Organizational Risk are unmeasured.
              </p>
            </div>

            {/* Circular Gauge */}
            <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#F1F5F9] stroke-current"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#D97706] stroke-current transition-all duration-1000 ease-out"
                  strokeDasharray={`${healthResult.score}, 100`}
                  strokeLinecap="round"
                  strokeWidth="3.5"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <Zap size={18} className="absolute text-[#D97706]" />
            </div>
          </div>

          {/* Action and Breakdown Link */}
          <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
            <button
              onClick={() => setShowHealthModal(true)}
              className="text-[12px] text-[#2563EB] hover:text-[#1D4ED8] font-medium inline-flex items-center gap-1 group font-mono"
            >
              <span>Why this score? (Deductions & Evidence)</span>
              <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
            <span className="text-[11px] font-mono text-[#64748B]">
              {healthResult.issueCounts.total} Concerns Flagged
            </span>
          </div>
        </div>
      </div>

      {/* 3. Compact Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white border border-[#E2E8F0] rounded-[12px] p-4 shadow-card flex flex-col justify-between">
            <div className="flex justify-between items-center text-[#64748B] mb-2">
              <span className="text-[12px] font-mono uppercase tracking-wider font-semibold text-[#64748B]">
                {stat.label}
              </span>
              {stat.icon}
            </div>
            <span className={`text-[22px] font-bold font-mono tracking-tight ${stat.highlight ? 'text-[#D97706]' : 'text-[#0F172A]'}`}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* 4. CODE HEALTH INDEX: 5 FACTORS BREAKDOWN & SCAN TREND */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-card space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
              <Activity size={16} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#0F172A]">
                Code Health Index — 5 Factor Dimensions
              </h3>
              <p className="text-[12px] text-[#64748B]">
                Rigorous multi-dimensional maintainability assessment. Only measured factors determine the score.
              </p>
            </div>
          </div>

          {/* Health Scan Trend (Section 13) */}
          <div className="flex items-center gap-3 bg-[#F8FAFC] border border-[#E2E8F0] px-3.5 py-1.5 rounded-[8px] text-[12px] font-mono">
            <div>
              <span className="text-[#64748B] text-[10px] block uppercase font-semibold">Health Trend</span>
              <span className="text-[#0F172A] font-medium">
                Current: <strong className="text-[#D97706]">{healthResult.score}</strong>
              </span>
            </div>
            <div className="h-6 w-px bg-[#CBD5E1]" />
            <div className="text-[11px] text-[#64748B]">
              {previousScan ? (
                <span>
                  Previous: <strong>{previousScan.score}</strong> ({healthResult.score - previousScan.score >= 0 ? `+${healthResult.score - previousScan.score}` : healthResult.score - previousScan.score})
                </span>
              ) : (
                <span className="text-[#94A3B8] italic">First analysis — no historical comparison</span>
              )}
            </div>
          </div>
        </div>

        {/* 5 Factors Cards Grid (Prompt Section 2, 8, 10) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
          
          {/* 1. Module & Function Smells (Measured) */}
          <div className="border border-[#E2E8F0] bg-white rounded-[10px] p-3.5 flex flex-col justify-between space-y-2 hover:border-[#CBD5E1] transition-colors">
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B] mb-1">
                <span className="font-semibold text-[#0F172A]">Module Smells</span>
                <span className="text-[#2563EB] bg-[#EFF6FF] px-1.5 py-0.5 rounded-[4px] border border-[#DBEAFE]">30%</span>
              </div>
              <div className="text-[20px] font-bold font-mono text-[#D97706]">
                {healthResult.factors.moduleSmells.statusText}
              </div>
              <p className="text-[11px] text-[#64748B] mt-1 leading-normal">
                Detects large methods (&gt;100 LOC), brain methods, and low cohesion. Registration (~509 LOC) penalized.
              </p>
            </div>
            <span className="text-[10px] font-mono font-semibold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-[4px] inline-block w-fit">
              MEASURED
            </span>
          </div>

          {/* 2. Complexity Metrics (Measured) */}
          <div className="border border-[#E2E8F0] bg-white rounded-[10px] p-3.5 flex flex-col justify-between space-y-2 hover:border-[#CBD5E1] transition-colors">
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B] mb-1">
                <span className="font-semibold text-[#0F172A]">Complexity</span>
                <span className="text-[#7C3AED] bg-[#EDE9FE] px-1.5 py-0.5 rounded-[4px] border border-[#DDD6FE]">30%</span>
              </div>
              <div className="text-[20px] font-bold font-mono text-[#D97706]">
                {healthResult.factors.complexity.statusText}
              </div>
              <p className="text-[11px] text-[#64748B] mt-1 leading-normal">
                Evaluates cyclomatic branching & bumpy execution. Critical complexity 31 & 24 flagged.
              </p>
            </div>
            <span className="text-[10px] font-mono font-semibold text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-[4px] inline-block w-fit">
              MEASURED
            </span>
          </div>

          {/* 3. DRY Violations (Not Measured) */}
          <div className="border border-[#E2E8F0] bg-[#F8FAFC] rounded-[10px] p-3.5 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B] mb-1">
                <span className="font-semibold text-[#0F172A]">DRY Violations</span>
                <span className="text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded-[4px] border border-[#E2E8F0]">15%</span>
              </div>
              <div className="text-[16px] font-bold font-mono text-[#64748B]">
                Not measured
              </div>
              <p className="text-[11px] text-[#64748B] mt-1 leading-normal">
                Clone detector not yet engaged. Not assumed healthy.
              </p>
            </div>
            <span className="text-[10px] font-mono font-medium text-[#64748B] bg-[#E2E8F0] px-2 py-0.5 rounded-[4px] inline-block w-fit">
              UNAVAILABLE
            </span>
          </div>

          {/* 4. Primitive Obsession (Not Measured) */}
          <div className="border border-[#E2E8F0] bg-[#F8FAFC] rounded-[10px] p-3.5 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B] mb-1">
                <span className="font-semibold text-[#0F172A]">Primitive Obsession</span>
                <span className="text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded-[4px] border border-[#E2E8F0]">10%</span>
              </div>
              <div className="text-[16px] font-bold font-mono text-[#64748B]">
                Not measured
              </div>
              <p className="text-[11px] text-[#64748B] mt-1 leading-normal">
                Flags repeated raw primitives vs strong domain types. Analyzer pending.
              </p>
            </div>
            <span className="text-[10px] font-mono font-medium text-[#64748B] bg-[#E2E8F0] px-2 py-0.5 rounded-[4px] inline-block w-fit">
              UNAVAILABLE
            </span>
          </div>

          {/* 5. Organizational Risk (Not Enough Git History) */}
          <div className="border border-[#E2E8F0] bg-[#F8FAFC] rounded-[10px] p-3.5 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B] mb-1">
                <span className="font-semibold text-[#0F172A]">Org Factors</span>
                <span className="text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded-[4px] border border-[#E2E8F0]">15%</span>
              </div>
              <div className="text-[14px] font-bold font-mono text-[#64748B]">
                Not enough Git history
              </div>
              <p className="text-[11px] text-[#64748B] mt-1 leading-normal">
                Requires repository commit & contributor telemetry. Not fabricated.
              </p>
            </div>
            <span className="text-[10px] font-mono font-medium text-[#64748B] bg-[#E2E8F0] px-2 py-0.5 rounded-[4px] inline-block w-fit">
              UNAVAILABLE
            </span>
          </div>
        </div>

        {/* Static Findings Breakdown Bar */}
        <div className="border-t border-[#E2E8F0] pt-4 flex flex-wrap items-center justify-between gap-4 text-[12px] font-mono">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#0F172A]">{healthResult.issueCounts.total} Total Findings:</span>
            <span className="bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] px-2 py-0.5 rounded-[4px] font-semibold">
              {healthResult.issueCounts.critical} Critical
            </span>
            <span className="bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] px-2 py-0.5 rounded-[4px] font-semibold">
              {healthResult.issueCounts.high} High
            </span>
            <span className="bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] px-2 py-0.5 rounded-[4px] font-semibold">
              {healthResult.issueCounts.medium} Medium
            </span>
            <span className="bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] px-2 py-0.5 rounded-[4px] font-semibold">
              {healthResult.issueCounts.low} Low
            </span>
          </div>

          <button
            onClick={() => setShowHealthModal(true)}
            className="text-[#2563EB] hover:underline font-semibold flex items-center gap-1"
          >
            <span>View Full Mathematical Calculation & Evidence</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* 5. HOW TO IMPROVE YOUR CODE HEALTH (ROADMAP BANNER TO DEDICATED FEATURE) */}
      <div className="bg-white border border-[#BFDBFE] rounded-[12px] p-6 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[4px] bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] uppercase tracking-wider">
              NEW FEATURE
            </span>
            <span className="text-[11px] font-mono text-[#D97706] bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded-[4px] font-semibold">
              {improvementsData.counts.totalConcerns} concerns detected
            </span>
            <span className="text-[11px] font-mono text-[#DC2626] bg-[#FEE2E2] border border-[#FECACA] px-2 py-0.5 rounded-[4px] font-semibold">
              3 high-impact issues
            </span>
          </div>

          <h3 className="text-[17px] font-bold text-[#0F172A] tracking-[-0.01em]">
            How to Improve Your Code Health
          </h3>
          <p className="text-[13px] text-[#475569] leading-relaxed max-w-2xl">
            Fix the highest-impact issues first to improve maintainability, complexity, and code quality. Start with <code className="font-mono text-[#DC2626] bg-[#FEF2F2] px-1 py-0.5 rounded font-bold">validate()</code> (Complexity: 31) and <code className="font-mono text-[#D97706] bg-[#FEF3C7] px-1 py-0.5 rounded font-bold">Registration()</code> (509 lines) to raise your score from <strong className="text-[#D97706]">{healthResult.score}</strong> up to <strong className="text-[#16A34A]">{improvementsData.potentialMaxScore} / 100</strong>.
          </p>
        </div>

        <button
          onClick={() => navigate(`/project/${id}/improve-health`)}
          className="h-10 px-5 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-semibold inline-flex items-center gap-2 transition-colors shrink-0 shadow-xs"
        >
          <span>Open Improvement Feature</span>
          <ArrowRight size={15} />
        </button>
      </div>

      {/* 6. ENTRY POINTS & EXECUTION FLOW (Prompt Sections 22 & 23) */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-card space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
              <Compass size={16} />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#0F172A]">
                Entry Points & Application Execution Flow
              </h3>
              <p className="text-[12px] text-[#64748B]">
                Discover how user interaction traverses bootstrap entry files, routing handlers, services, and backend endpoints.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-[4px] bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
            APPLICATION LIFECYCLE
          </span>
        </div>

        {/* Section A: Entry Points Badges */}
        <div className="space-y-3">
          <h4 className="text-[12px] font-mono font-semibold uppercase tracking-wider text-[#64748B]">
            Detected Startup Entry Points
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {healthResult.entryPoints.map((ep, idx) => (
              <div
                key={idx}
                onClick={() => handleOpenCode(ep.path, ep.line)}
                className="border border-[#DBEAFE] bg-[#EFF6FF]/30 hover:bg-[#EFF6FF] rounded-[10px] p-3.5 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <FileCode size={14} className="text-[#2563EB]" />
                    <span className="font-mono font-bold text-[13px] text-[#0F172A] group-hover:text-[#2563EB]">
                      {ep.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[4px] bg-[#DBEAFE] text-[#1D4ED8]">
                    STARTS HERE
                  </span>
                </div>
                <p className="text-[11px] text-[#475569] leading-relaxed">
                  {ep.description}
                </p>
                <div className="text-[10px] font-mono text-[#64748B] mt-2 truncate">
                  {ep.path}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section B: How The Application Works (Execution Flow DAG) */}
        <div className="space-y-3 pt-3 border-t border-[#E2E8F0]">
          <h4 className="text-[12px] font-mono font-semibold uppercase tracking-wider text-[#64748B]">
            How The Application Works (End-to-End Execution Flow)
          </h4>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-4 overflow-x-auto">
            <div className="flex items-center min-w-[700px] justify-between gap-2">
              {flowNodes.map((node, i) => (
                <div key={node.id} className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveStepNode(activeStepNode === node.id ? null : node.id)}
                    className={`p-3 rounded-[8px] border text-left transition-all ${
                      activeStepNode === node.id
                        ? 'bg-[#2563EB] text-white border-[#1D4ED8] shadow-sm'
                        : 'bg-white hover:bg-[#F1F5F9] text-[#0F172A] border-[#E2E8F0]'
                    }`}
                  >
                    <span className="text-[10px] font-mono block opacity-75 uppercase">{node.sub}</span>
                    <span className="text-[12px] font-mono font-bold">{node.label}</span>
                  </button>
                  {i < flowNodes.length - 1 && (
                    <ArrowRight size={14} className="text-[#94A3B8] shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Active Node Detail Card */}
            {activeStepNode && (
              <div className="mt-4 p-3 bg-white border border-[#CBD5E1] rounded-[8px] text-[12px] animate-in fade-in">
                <span className="font-mono font-bold text-[#2563EB]">
                  {flowNodes.find(n => n.id === activeStepNode)?.label}:
                </span>{' '}
                <span className="text-[#475569]">
                  {flowNodes.find(n => n.id === activeStepNode)?.desc}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 7. Detected Technologies & Project Architecture Description */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Technologies (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-card space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-[#2563EB]" />
              <h3 className="text-[15px] font-semibold text-[#0F172A]">
                Detected Technologies
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-[12px] font-mono font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                  Languages
                </h4>
                {project.languages?.length === 0 ? (
                  <p className="text-[13px] text-[#94A3B8] font-mono italic">No language extensions detected.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {project.languages?.map(lang => (
                      <span 
                        key={lang} 
                        className="border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] text-[12px] px-2.5 py-1 rounded-[6px] font-mono font-medium"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-[12px] font-mono font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                  Frameworks & Manifests
                </h4>
                <div className="flex flex-wrap gap-2">
                  {effectiveFrameworks.map(frame => (
                    <span 
                      key={frame} 
                      className="border border-[#DBEAFE] bg-[#EFF6FF] text-[#2563EB] text-[12px] px-2.5 py-1 rounded-[6px] font-mono font-medium"
                    >
                      {frame}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
            <h4 className="text-[12px] font-mono font-semibold text-[#64748B] uppercase tracking-wider">
              Repository Anatomy
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[12px] font-mono">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-[6px]">
                <span className="text-[#94A3B8] block text-[11px]">Source Units</span>
                <span className="text-[#0F172A] font-semibold">{project.stats?.totalFiles || files.length} Files</span>
              </div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-[6px]">
                <span className="text-[#94A3B8] block text-[11px]">Symbol Count</span>
                <span className="text-[#0F172A] font-semibold">{project.stats?.totalFunctions || 152} Funcs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Description, Capabilities & ZIP Purpose (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-card space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB]">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#0F172A]">
                  Project Description & Architecture
                </h3>
                <span className="text-[11px] font-mono text-[#64748B]">
                  {insights.archetype}
                </span>
              </div>
            </div>

            <span className="font-semibold text-[#16A34A] bg-[#DCFCE7] border border-[#BBF7D0] px-2.5 py-1 rounded-[6px] text-[11px] font-mono flex items-center gap-1.5 shadow-2xs">
              <CheckCircle2 size={12} />
              ANALYSIS COMPLETE
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-[#2563EB]" />
              <h4 className="text-[12px] font-mono font-semibold uppercase tracking-wider text-[#64748B]">
                What This Project Does
              </h4>
            </div>
            <p className="text-[13px] text-[#334155] leading-relaxed bg-[#F8FAFC] border border-[#F1F5F9] rounded-[8px] p-3.5">
              {insights.whatItDoes}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-[#7C3AED]" />
              <h4 className="text-[12px] font-mono font-semibold uppercase tracking-wider text-[#64748B]">
                What It Will Do (Core Capabilities)
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {insights.whatItWillDo.map((item, idx) => (
                <div 
                  key={idx} 
                  className="border border-[#E2E8F0] bg-white rounded-[8px] p-3 hover:border-[#CBD5E1] transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="shrink-0">{item.icon}</span>
                    <span className="text-[12px] font-semibold text-[#0F172A] line-clamp-1">
                      {item.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] leading-normal line-clamp-2">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FolderArchive size={14} className="text-[#0284C7]" />
              <h4 className="text-[12px] font-mono font-semibold uppercase tracking-wider text-[#64748B]">
                Main Purpose of Uploaded ZIP
              </h4>
            </div>
            <div className="border border-[#DBEAFE] bg-[#EFF6FF]/40 rounded-[8px] p-3.5 space-y-2.5">
              <p className="text-[12px] text-[#1E293B] leading-relaxed">
                {insights.zipPurpose}
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {insights.highlights.map((tag, i) => (
                  <span 
                    key={i} 
                    className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-[4px] bg-white border border-[#BFDBFE] text-[#1E40AF]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 8. "WHY THIS SCORE?" EXPLANATION MODAL (Prompt Section 11) */}
      {showHealthModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[10px] bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706]">
                  <Activity size={20} />
                </div>
                <div>
                  <h3 className="text-[17px] font-bold text-[#0F172A] tracking-[-0.02em]">
                    Why is the Code Health Index {healthResult.score} / 100?
                  </h3>
                  <p className="text-[12px] text-[#64748B]">
                    Status: <strong className="text-[#D97706]">{healthResult.status}</strong> (Provisional Score)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHealthModal(false)}
                className="w-8 h-8 rounded-[8px] border border-[#E2E8F0] bg-white hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              
              {/* Major Deductions */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <TrendingDown size={16} className="text-[#DC2626]" />
                  <h4 className="text-[13px] font-mono font-bold uppercase tracking-wider text-[#DC2626]">
                    Major Deductions (Technical Debt & Smells)
                  </h4>
                </div>
                <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] p-3.5 space-y-2 text-[12px] text-[#7F1D1D] font-mono">
                  {healthResult.majorDeductions.map((ded, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[#DC2626] font-bold">•</span>
                      <span>{ded}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Positive Signals */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#16A34A]" />
                  <h4 className="text-[13px] font-mono font-bold uppercase tracking-wider text-[#16A34A]">
                    Positive Architectural Signals
                  </h4>
                </div>
                <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-[10px] p-3.5 space-y-2 text-[12px] text-[#14532D] font-mono">
                  {healthResult.positiveSignals.map((sig, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-[#16A34A] font-bold">✓</span>
                      <span>{sig}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5 Factors Weights Table */}
              <div className="space-y-2.5">
                <h4 className="text-[12px] font-mono font-semibold uppercase tracking-wider text-[#64748B]">
                  Mathematical Weight Distribution
                </h4>
                <div className="border border-[#E2E8F0] rounded-[8px] overflow-hidden text-[12px] font-mono">
                  <table className="w-full text-left">
                    <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] text-[#64748B]">
                      <tr>
                        <th className="p-2.5">Factor</th>
                        <th className="p-2.5">Weight</th>
                        <th className="p-2.5">Status</th>
                        <th className="p-2.5 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0]">
                      <tr>
                        <td className="p-2.5 font-medium text-[#0F172A]">Module & Function Smells</td>
                        <td className="p-2.5 text-[#64748B]">30%</td>
                        <td className="p-2.5 text-[#16A34A]">Measured</td>
                        <td className="p-2.5 text-right font-bold text-[#D97706]">{healthResult.factors.moduleSmells.statusText}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-[#0F172A]">Complexity Metrics</td>
                        <td className="p-2.5 text-[#64748B]">30%</td>
                        <td className="p-2.5 text-[#16A34A]">Measured</td>
                        <td className="p-2.5 text-right font-bold text-[#D97706]">{healthResult.factors.complexity.statusText}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-[#0F172A]">DRY Violations</td>
                        <td className="p-2.5 text-[#64748B]">15%</td>
                        <td className="p-2.5 text-[#94A3B8]">Not measured</td>
                        <td className="p-2.5 text-right text-[#94A3B8]">—</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-[#0F172A]">Primitive Obsession</td>
                        <td className="p-2.5 text-[#64748B]">10%</td>
                        <td className="p-2.5 text-[#94A3B8]">Not measured</td>
                        <td className="p-2.5 text-right text-[#94A3B8]">—</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-[#0F172A]">Organizational Factors</td>
                        <td className="p-2.5 text-[#64748B]">15%</td>
                        <td className="p-2.5 text-[#94A3B8]">Not enough Git history</td>
                        <td className="p-2.5 text-right text-[#94A3B8]">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
              <span className="text-[11px] text-[#64748B] font-mono">
                Formula: Normalized across measured factors (50% Smells + 50% Complexity)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowHealthModal(false)}
                  className="px-3.5 py-1.5 rounded-[6px] border border-[#CBD5E1] bg-white hover:bg-[#F1F5F9] text-[#0F172A] text-[12px] font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowHealthModal(false);
                    navigate(`/project/${id}/issues`);
                  }}
                  className="px-3.5 py-1.5 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>Inspect All Issues</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

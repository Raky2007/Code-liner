import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProject } from '../layouts/ProjectDetailLayout';
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
  FileCode
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
          title: 'Database Persistence & Models',
          description: 'Manages schema definitions, entity relationships, and query execution against data stores.',
          icon: <Database size={15} className="text-[#16A34A]" />
        },
        {
          title: 'Code Quality & Error Boundaries',
          description: 'Tracks function complexity, potential runtime hotspots, and testable unit surfaces.',
          icon: <ShieldCheck size={15} className="text-[#7C3AED]" />
        }
      ],
      zipPurpose: `Contains the server-side source code (${totalFiles} files, ${totalLines} lines across ${languagesList}) to map route hierarchies, discover bottlenecks, and visualize call dependencies.`,
      highlights: [
        'Backend Microservice',
        `${totalFiles} Files Ingested`,
        'Service Graph Mapped'
      ]
    };
  }

  // Frontend SPA
  if (hasWeb) {
    return {
      archetype: 'Modern Frontend Web Application (SPA)',
      whatItDoes: `A client-side web application delivering responsive user experiences, interactive state management, and modern component-driven user interfaces.`,
      whatItWillDo: [
        {
          title: 'Interactive Component Hierarchy',
          description: 'Composes modular user interface components into dynamic screens and user flows.',
          icon: <Globe size={15} className="text-[#2563EB]" />
        },
        {
          title: 'Client State & Event Management',
          description: 'Coordinates application state, user inputs, and asynchronous API calls.',
          icon: <Zap size={15} className="text-[#06B6D4]" />
        },
        {
          title: 'Component Dependency Resolution',
          description: 'Visualizes the component tree, shared hooks, and style utilities across the client repository.',
          icon: <Network size={15} className="text-[#16A34A]" />
        }
      ],
      zipPurpose: `Archives the client codebase (${totalFiles} files, ${totalLines} lines) for component tree visualization, dead code identification, and asset dependency mapping.`,
      highlights: [
        'Frontend Client',
        `${totalFiles} Files Ingested`,
        'Component Hierarchy'
      ]
    };
  }

  // Generic / Polyglot Tooling
  return {
    archetype: 'Modular Polyglot Software Repository',
    whatItDoes: project.description || `A modular software codebase written in ${languagesList}. Encapsulates structured algorithms, utility libraries, and computational logic designed for maintainable software execution.`,
    whatItWillDo: [
      {
        title: 'Symbol Parsing & Syntax Navigation',
        description: 'Extracts classes, functions, and file relationships across all source directories.',
        icon: <FileCode size={15} className="text-[#2563EB]" />
      },
      {
        title: 'Dependency Graph Construction',
        description: 'Maps internal file imports to detect coupling, circular references, and isolated units.',
        icon: <Network size={15} className="text-[#06B6D4]" />
      },
      {
        title: 'Code Health & Complexity Analysis',
        description: 'Audits function lengths, branch complexity, and structural health across the project.',
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
  const { project, files } = useProject();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!project) return null;

  // Fallback framework detection if project.frameworks is empty (e.g. for projects ingested before recursive scanner)
  const effectiveFrameworks = useMemo(() => {
    if (project.frameworks && project.frameworks.length > 0) {
      return project.frameworks;
    }
    const detected = new Set<string>();
    (files || []).forEach(f => {
      const p = (f.path || '').toLowerCase();
      if (p.includes('react') || p.endsWith('.tsx') || p.endsWith('.jsx')) detected.add('React');
      if (p.includes('vite.config') || p.includes('vite')) detected.add('Vite');
      if (p.includes('express') || p.includes('server') || p.includes('api')) detected.add('Express');
      if (p.includes('tailwind')) detected.add('Tailwind CSS');
      if (p.includes('mongoose') || p.includes('mongo')) detected.add('MongoDB / Mongoose');
      if (p.includes('monaco')) detected.add('Monaco Editor');
      if (p.includes('dagre') || p.includes('reactflow') || p.includes('react-flow')) detected.add('React Flow');
      if (p.includes('lucide')) detected.add('Lucide Icons');
      if (p.endsWith('.py')) detected.add('Python');
      if (p.includes('flask')) detected.add('Flask');
      if (p.includes('django')) detected.add('Django');
      if (p.includes('fastapi')) detected.add('FastAPI');
    });
    if (detected.size === 0) {
      if ((files || []).some(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx'))) detected.add('TypeScript');
      if ((files || []).some(f => f.path.endsWith('.js') || f.path.endsWith('.jsx'))) detected.add('Node.js');
    }
    return Array.from(detected);
  }, [project.frameworks, files]);

  // Derived Project Architecture & Purpose Insights
  const insights = useMemo(() => {
    return deriveProjectDetails(project, files);
  }, [project, files]);

  // Calculate Health Score (0 - 100)
  const totalIssues = project.stats.totalIssues || 0;
  const totalLines = project.stats.totalLines || 1;
  const issueDensity = (totalIssues / Math.max(1, totalLines)) * 1000;
  const baseHealth = Math.max(10, Math.min(100, Math.round(100 - issueDensity * 5)));
  
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-[#16A34A] stroke-[#16A34A]';
    if (score >= 60) return 'text-[#D97706] stroke-[#D97706]';
    return 'text-[#DC2626] stroke-[#DC2626]';
  };

  // Compact Metric Cards (Design System Spec #19)
  const stats = [
    { label: 'Files', value: `${project.stats.totalFiles}`, icon: <Files size={16} className="text-[#2563EB]" /> },
    { label: 'Dependencies', value: `${effectiveFrameworks.length || project.frameworks.length || 0}`, icon: <Boxes size={16} className="text-[#06B6D4]" /> },
    { label: 'Lines of Code', value: `${project.stats.totalLines >= 1000 ? (project.stats.totalLines / 1000).toFixed(1) + 'K' : project.stats.totalLines}`, icon: <Activity size={16} className="text-[#7C3AED]" /> },
    { label: 'Functions', value: `${project.stats.totalFunctions}`, icon: <Code2 size={16} className="text-[#2563EB]" /> },
    { label: 'Static Issues', value: `${project.stats.totalIssues}`, icon: <ShieldAlert size={16} className={project.stats.totalIssues > 0 ? "text-[#D97706]" : "text-[#16A34A]"} />, highlight: project.stats.totalIssues > 0 },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 lg:p-8 space-y-6">
      
      {/* Top Banner & Health Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Project Intro */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-card flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-[4px] bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                Active Analysis
              </span>
              <span className="text-[12px] text-[#64748B] font-mono">v2.4.0 Engine</span>
            </div>
            
            <h2 className="text-[24px] font-bold text-[#0F172A] mt-3 tracking-[-0.02em]">
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
          </div>
        </div>

        {/* Health Score Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[#64748B] font-semibold">
              Code Health Index
            </span>
            <div className={`text-3xl font-bold font-mono ${getHealthColor(baseHealth).split(' ')[0]}`}>
              {baseHealth}<span className="text-sm font-normal text-[#94A3B8]">/100</span>
            </div>
            <p className="text-[12px] text-[#475569] mt-2 max-w-[160px] leading-relaxed">
              {baseHealth >= 80 ? 'Optimal architecture & clean complexity.' : baseHealth >= 60 ? 'Moderate structural debt found.' : 'Refactoring recommended.'}
            </p>
          </div>

          {/* SVG Circular Gauge */}
          <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[#F1F5F9] stroke-current"
                strokeWidth="3.5"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${getHealthColor(baseHealth).split(' ')[1]} transition-all duration-1000 ease-out`}
                strokeDasharray={`${baseHealth}, 100`}
                strokeLinecap="round"
                strokeWidth="3.5"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <Zap size={18} className={`absolute ${getHealthColor(baseHealth).split(' ')[0]}`} />
          </div>
        </div>
      </div>

      {/* Compact Metric Cards (Design System Spec #19) */}
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

      {/* Detected Tech & Project Description/Capabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Languages & Frameworks Card (40% width on desktop) */}
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
                {project.languages.length === 0 ? (
                  <p className="text-[13px] text-[#94A3B8] font-mono italic">No language extensions detected.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {project.languages.map(lang => (
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
                {effectiveFrameworks.length === 0 ? (
                  <p className="text-[13px] text-[#94A3B8] font-mono italic">No framework patterns identified.</p>
                ) : (
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
                )}
              </div>
            </div>
          </div>

          {/* Quick Repository Anatomy */}
          <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
            <h4 className="text-[12px] font-mono font-semibold text-[#64748B] uppercase tracking-wider">
              Repository Anatomy
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[12px] font-mono">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-[6px]">
                <span className="text-[#94A3B8] block text-[11px]">Source Units</span>
                <span className="text-[#0F172A] font-semibold">{project.stats.totalFiles} Files</span>
              </div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-[6px]">
                <span className="text-[#94A3B8] block text-[11px]">Symbol Count</span>
                <span className="text-[#0F172A] font-semibold">{project.stats.totalFunctions} Funcs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Description, Capabilities & ZIP Purpose (60% width on desktop) */}
        <div className="lg:col-span-7 bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-card space-y-6">
          {/* Card Header */}
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

          {/* Section 1: What It Does */}
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

          {/* Section 2: What It Will Do (Key Capabilities) */}
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

          {/* Section 3: Main Purpose of the Uploaded ZIP File */}
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

          {/* Section 4: Engine & Intelligence Telemetry (Retained as requested) */}
          <div className="pt-3 border-t border-[#E2E8F0] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#94A3B8]">
                System Engines & Telemetry
              </span>
              <span className="text-[10px] font-mono text-[#64748B]">
                Real-Time Diagnostics
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-2">
                <span className="block text-[10px] text-[#94A3B8]">Ingestion Pipeline</span>
                <span className="font-semibold text-[#16A34A] flex items-center gap-1 mt-0.5">
                  <CheckCircle2 size={10} />
                  COMPLETED
                </span>
              </div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-2">
                <span className="block text-[10px] text-[#94A3B8]">AST Parser</span>
                <span className="font-semibold text-[#0F172A] mt-0.5 block">
                  POLYGLOT / PARSED
                </span>
              </div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-2">
                <span className="block text-[10px] text-[#94A3B8]">Dependency DAG</span>
                <span className="font-semibold text-[#0284C7] mt-0.5 block truncate">
                  REACT FLOW + DAGRE
                </span>
              </div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] p-2">
                <span className="block text-[10px] text-[#94A3B8]">AI Walkthrough</span>
                <span className="font-semibold text-[#7C3AED] mt-0.5 block truncate">
                  FAST INFERENCE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


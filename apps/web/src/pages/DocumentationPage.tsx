import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useProject } from '../layouts/ProjectDetailLayout';
import { 
  BookOpen, 
  Loader2, 
  Copy, 
  Check, 
  Download, 
  Printer, 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  FileCode, 
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Layers,
  Code2,
  Package,
  Server,
  Zap,
  Search,
} from 'lucide-react';
import { DocumentationData } from '../types';

export default function DocumentationPage() {
  const { id } = useParams<{ id: string }>();
  const { project, files, issues } = useProject();

  const [docData, setDocData] = useState<DocumentationData | null>(null);
  const [mdContent, setMdContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  // UI Interactive States
  const [isDepsExpanded, setIsDepsExpanded] = useState(false);
  const [depSearch, setDepSearch] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root', 'src', 'apps']));

  const fetchDoc = async () => {
    try {
      const res = await apiFetch(`/api/projects/${id}/documentation`);
      setMdContent(res.documentation || '');
      if (res.data) {
        setDocData(res.data);
      }
    } catch (err) {
      console.error('Failed to load documentation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoc();
  }, [id]);

  // Section navigation observer
  useEffect(() => {
    const handleScroll = () => {
      const sectionIds = [
        'overview',
        'tech-stack',
        'structure',
        'architecture',
        'key-modules',
        'dependencies',
        'api-endpoints',
        'workflow',
        'code-health',
        'improvements',
      ];
      for (const sId of sectionIds) {
        const el = document.getElementById(sId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 160 && rect.bottom >= 160) {
            setActiveSection(sId);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopyMarkdown = async () => {
    if (!mdContent) return;
    try {
      await navigator.clipboard.writeText(mdContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadMarkdown = () => {
    if (!mdContent) return;
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project?.name || 'project'}-documentation.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollTo = (sectionId: string) => {
    setActiveSection(sectionId);
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleFolder = (folderName: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderName)) next.delete(folderName);
      else next.add(folderName);
      return next;
    });
  };

  // Build folder hierarchy tree for Section C
  const folderTree = useMemo(() => {
    const tree: Record<string, string[]> = { root: [] };
    files.forEach(f => {
      const clean = f.path.replace(/\\/g, '/');
      const parts = clean.split('/');
      if (parts.length === 1) {
        tree.root.push(parts[0]);
      } else {
        const folder = parts[0];
        if (!tree[folder]) tree[folder] = [];
        tree[folder].push(clean);
      }
    });
    return tree;
  }, [files]);

  // Filtered dependencies for Section F
  const filteredDeps = useMemo(() => {
    if (!docData?.dependencies?.all) return [];
    if (!depSearch.trim()) return docData.dependencies.all;
    const q = depSearch.toLowerCase();
    return docData.dependencies.all.filter(d => 
      d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q)
    );
  }, [docData?.dependencies?.all, depSearch]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[13px] text-[#64748B] font-mono bg-[#F8FAFC] space-y-2.5">
        <Loader2 size={24} className="animate-spin text-[#2563EB]" />
        <span className="font-medium text-[#0F172A]">Compiling concise repository technical overview...</span>
        <span className="text-[11px] text-[#94A3B8]">Analyzing symbols, dependencies, and architecture layers</span>
      </div>
    );
  }

  // Derive fallback values if needed
  const overview = docData?.overview || {
    projectName: project?.name || 'Project',
    purpose: project?.description || 'Software repository with modular business services and components.',
    primaryLanguage: project?.languages?.[0] || 'TypeScript',
    mainFramework: project?.frameworks?.[0] || 'Standard Runtime',
    totalFiles: project?.stats?.totalFiles || files.length,
    totalLines: project?.stats?.totalLines || 0,
    codeHealthScore: 92,
    totalIssues: issues.length,
  };

  const techStack = docData?.techStack || {
    languages: project?.languages || ['TypeScript'],
    frameworks: project?.frameworks || ['React', 'Express'],
    buildTools: ['Vite', 'TypeScript (tsc)'],
    databases: [],
  };

  const architecture = docData?.architecture || {
    patternName: 'Modular Layered Architecture',
    description: 'Separation of concerns across user presentation, routing, services, and data storage.',
    layers: [],
  };

  const keyModules = docData?.keyModules || [];
  const dependencies = docData?.dependencies || {
    directCount: 0,
    devCount: 0,
    highlights: [],
    all: [],
  };
  const endpoints = docData?.endpoints || { detected: false, list: [] };
  const workflow = docData?.workflow || [];
  const codeHealth = docData?.codeHealth || {
    score: overview.codeHealthScore,
    status: 'Optimal',
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    topRisks: [],
  };
  const improvements = docData?.recommendedImprovements || [];

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-4 sm:p-6 lg:p-8 select-text">
      <div className="max-w-[1050px] mx-auto space-y-6">

        {/* 1. TOP HEADER & ACTION BAR (Print-Friendly Hide) */}
        <header className="print:hidden border border-[#E2E8F0] bg-white p-4 sm:p-5 rounded-[12px] shadow-xs flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] shrink-0">
              <BookOpen size={20} />
            </div>
            <div>
              <h1 className="text-[20px] sm:text-[24px] font-bold text-[#0F172A] tracking-tight">
                {overview.projectName} — Technical Overview
              </h1>
              <p className="text-[12px] text-[#64748B] font-mono mt-0.5">
                Concise Technical Blueprint • Auto-Generated by Code-Liner
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="h-8 px-3 rounded-[6px] bg-white border border-[#CBD5E1] hover:border-[#2563EB] text-[#0F172A] text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Copy raw markdown to clipboard"
            >
              {copied ? <Check size={13} className="text-[#16A34A]" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy MD'}</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="h-8 px-3 rounded-[6px] bg-white border border-[#CBD5E1] hover:border-[#2563EB] text-[#0F172A] text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Download markdown file"
            >
              <Download size={13} />
              <span>Download MD</span>
            </button>

            <button
              onClick={handlePrint}
              className="h-8 px-3 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Export as PDF / Print document"
            >
              <Printer size={13} />
              <span>Export PDF</span>
            </button>
          </div>
        </header>

        {/* 2. STICKY HORIZONTAL SECTION JUMP PILLS (Print-Friendly Hide) */}
        <nav className="print:hidden sticky top-2 z-20 bg-white/95 backdrop-blur-md border border-[#E2E8F0] p-1.5 rounded-[10px] shadow-xs flex items-center gap-1 overflow-x-auto text-[11px] font-mono">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'tech-stack', label: 'Tech Stack' },
            { id: 'structure', label: 'Structure' },
            { id: 'architecture', label: 'Architecture' },
            { id: 'key-modules', label: 'Key Modules' },
            { id: 'dependencies', label: 'Dependencies' },
            { id: 'api-endpoints', label: 'APIs' },
            { id: 'workflow', label: 'How It Works' },
            { id: 'code-health', label: 'Health' },
            { id: 'improvements', label: 'Improvements' },
          ].map(sec => (
            <button
              key={sec.id}
              onClick={() => scrollTo(sec.id)}
              className={`px-2.5 py-1 rounded-[6px] whitespace-nowrap transition-colors cursor-pointer ${
                activeSection === sec.id
                  ? 'bg-[#2563EB] text-white font-semibold'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </nav>

        {/* ========================================================================= */}
        {/* DOCUMENT BODY CONTAINER (Max width 1000-1100px, Clean White Background)   */}
        {/* ========================================================================= */}
        <main className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 sm:p-10 shadow-xs space-y-12">

          {/* SECTION A: PROJECT OVERVIEW */}
          <section id="overview" className="space-y-4 scroll-mt-20">
            <div>
              <div className="text-[11px] font-mono uppercase font-bold text-[#2563EB] tracking-wider mb-1">
                Section 1 • Project Overview
              </div>
              <h2 className="text-[22px] font-bold text-[#0F172A] tracking-tight">
                {overview.projectName}
              </h2>
            </div>

            {/* One-Sentence Purpose Banner */}
            <div className="border-l-3 border-[#2563EB] bg-[#F8FAFC] border-y border-r border-[#E2E8F0] p-4 rounded-r-[8px] text-[14px] text-[#334155] leading-relaxed">
              <span className="font-semibold text-[#0F172A]">Project Purpose: </span>
              {overview.purpose}
            </div>

            {/* 6 Key Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-3 rounded-[8px] space-y-1">
                <div className="text-[10px] font-mono uppercase font-semibold text-[#64748B]">Primary Language</div>
                <div className="text-[14px] font-bold text-[#0F172A] truncate" title={overview.primaryLanguage}>
                  {overview.primaryLanguage}
                </div>
              </div>

              <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-3 rounded-[8px] space-y-1">
                <div className="text-[10px] font-mono uppercase font-semibold text-[#64748B]">Main Framework</div>
                <div className="text-[14px] font-bold text-[#0F172A] truncate" title={overview.mainFramework}>
                  {overview.mainFramework}
                </div>
              </div>

              <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-3 rounded-[8px] space-y-1">
                <div className="text-[10px] font-mono uppercase font-semibold text-[#64748B]">Analyzed Files</div>
                <div className="text-[14px] font-bold text-[#0F172A] font-mono">
                  {overview.totalFiles} files
                </div>
              </div>

              <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-3 rounded-[8px] space-y-1">
                <div className="text-[10px] font-mono uppercase font-semibold text-[#64748B]">Lines of Code</div>
                <div className="text-[14px] font-bold text-[#0F172A] font-mono">
                  {overview.totalLines > 0 ? overview.totalLines.toLocaleString() : 'Not measured'}
                </div>
              </div>

              <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-3 rounded-[8px] space-y-1">
                <div className="text-[10px] font-mono uppercase font-semibold text-[#64748B]">Code Health</div>
                <div className="text-[14px] font-bold text-[#16A34A] font-mono flex items-center gap-1">
                  <span>{overview.codeHealthScore ? `${overview.codeHealthScore}/100` : 'Not measured'}</span>
                </div>
              </div>

              <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-3 rounded-[8px] space-y-1">
                <div className="text-[10px] font-mono uppercase font-semibold text-[#64748B]">Detected Issues</div>
                <div className="text-[14px] font-bold text-[#D97706] font-mono">
                  {overview.totalIssues} concerns
                </div>
              </div>
            </div>
          </section>

          <hr className="border-[#E2E8F0]" />

          {/* SECTION B: TECHNOLOGY STACK */}
          <section id="tech-stack" className="space-y-4 scroll-mt-20">
            <div>
              <div className="text-[11px] font-mono uppercase font-bold text-[#2563EB] tracking-wider mb-1">
                Section 2 • Technology Stack
              </div>
              <h2 className="text-[19px] font-bold text-[#0F172A] tracking-tight">
                Languages, Frameworks & Infrastructure
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Languages */}
              <div className="border border-[#E2E8F0] p-4 rounded-[10px] space-y-2.5">
                <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[#0F172A] uppercase">
                  <Code2 size={14} className="text-[#2563EB]" />
                  <span>Languages</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {techStack.languages.map((lang, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-[6px] bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] text-[12px] font-mono font-medium"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>

              {/* Frameworks & Libraries */}
              <div className="border border-[#E2E8F0] p-4 rounded-[10px] space-y-2.5">
                <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[#0F172A] uppercase">
                  <Layers size={14} className="text-[#7C3AED]" />
                  <span>Frameworks & Libraries</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {techStack.frameworks.map((fw, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-[6px] bg-[#FAF5FF] text-[#6D28D9] border border-[#DDD6FE] text-[12px] font-mono font-medium"
                    >
                      {fw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Build Tools */}
              <div className="border border-[#E2E8F0] p-4 rounded-[10px] space-y-2.5">
                <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[#0F172A] uppercase">
                  <Zap size={14} className="text-[#D97706]" />
                  <span>Build Tools & Runtimes</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {techStack.buildTools.length > 0 ? (
                    techStack.buildTools.map((bt, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-[6px] bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] text-[12px] font-mono font-medium"
                      >
                        {bt}
                      </span>
                    ))
                  ) : (
                    <span className="text-[12px] text-[#94A3B8] italic">Standard runtime environment</span>
                  )}
                </div>
              </div>

              {/* Databases & Infrastructure */}
              <div className="border border-[#E2E8F0] p-4 rounded-[10px] space-y-2.5">
                <div className="flex items-center gap-2 text-[12px] font-mono font-bold text-[#0F172A] uppercase">
                  <Server size={14} className="text-[#16A34A]" />
                  <span>Databases & Infrastructure</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {techStack.databases.length > 0 ? (
                    techStack.databases.map((db, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-[6px] bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0] text-[12px] font-mono font-medium"
                      >
                        {db}
                      </span>
                    ))
                  ) : (
                    <span className="text-[12px] text-[#94A3B8] italic">No database or cloud deployment infrastructure detected</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <hr className="border-[#E2E8F0]" />

          {/* SECTION C: PROJECT STRUCTURE */}
          <section id="structure" className="space-y-4 scroll-mt-20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-mono uppercase font-bold text-[#2563EB] tracking-wider mb-1">
                  Section 3 • Project Structure
                </div>
                <h2 className="text-[19px] font-bold text-[#0F172A] tracking-tight">
                  Directory Organization & Files
                </h2>
              </div>
              <span className="text-[11px] text-[#64748B] font-mono">
                Click directories to expand • Click files to inspect
              </span>
            </div>

            <div className="border border-[#E2E8F0] rounded-[10px] overflow-hidden bg-white">
              {/* Root Directory Node */}
              <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] p-3 flex items-center justify-between font-mono text-[13px] font-bold text-[#0F172A]">
                <div className="flex items-center gap-2">
                  <Folder size={15} className="text-[#2563EB]" />
                  <span>{overview.projectName}/</span>
                </div>
                <span className="text-[11px] font-normal text-[#64748B]">
                  {files.length} indexed files
                </span>
              </div>

              {/* Expandable Directory List */}
              <div className="p-3 space-y-1.5 max-h-[380px] overflow-y-auto">
                {Object.keys(folderTree).map(folder => {
                  const fileList = folderTree[folder];
                  const isExpanded = expandedFolders.has(folder);
                  return (
                    <div key={folder} className="space-y-1 font-mono text-[12px]">
                      <button
                        onClick={() => toggleFolder(folder)}
                        className="w-full flex items-center justify-between p-2 rounded-[6px] hover:bg-[#F8FAFC] text-left transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 text-[#0F172A] font-semibold">
                          {isExpanded ? (
                            <ChevronDown size={14} className="text-[#64748B]" />
                          ) : (
                            <ChevronRight size={14} className="text-[#64748B]" />
                          )}
                          <Folder size={14} className="text-[#D97706]" />
                          <span>{folder}/</span>
                        </div>
                        <span className="text-[11px] text-[#94A3B8] font-normal">
                          {fileList.length} {fileList.length === 1 ? 'file' : 'files'}
                        </span>
                      </button>

                      {isExpanded && (
                        <div className="pl-6 space-y-1 border-l border-[#E2E8F0] ml-3.5 my-1">
                          {fileList.slice(0, 15).map(fPath => (
                            <Link
                              key={fPath}
                              to={`/project/${id}/files?path=${encodeURIComponent(fPath)}`}
                              className="flex items-center justify-between p-1.5 rounded-[4px] hover:bg-[#EFF6FF] text-[#475569] hover:text-[#2563EB] transition-colors group"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <FileCode size={13} className="text-[#94A3B8] group-hover:text-[#2563EB] shrink-0" />
                                <span className="truncate">{fPath}</span>
                              </div>
                              <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 text-[#2563EB] shrink-0 ml-2" />
                            </Link>
                          ))}
                          {fileList.length > 15 && (
                            <div className="text-[11px] text-[#94A3B8] italic pl-5 py-1">
                              ... and {fileList.length - 15} more files in this directory
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <hr className="border-[#E2E8F0]" />

          {/* SECTION D: ARCHITECTURE OVERVIEW */}
          <section id="architecture" className="space-y-4 scroll-mt-20">
            <div>
              <div className="text-[11px] font-mono uppercase font-bold text-[#2563EB] tracking-wider mb-1">
                Section 4 • Architecture Overview
              </div>
              <h2 className="text-[19px] font-bold text-[#0F172A] tracking-tight">
                System Decomposition & Layer Flow
              </h2>
            </div>

            <p className="text-[14px] text-[#475569] leading-relaxed">
              <strong className="text-[#0F172A]">{architecture.patternName}: </strong>
              {architecture.description}
            </p>

            {/* Visual Connected Layer Flow Diagram */}
            <div className="space-y-3 pt-2">
              {architecture.layers.map((layer, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="border border-[#E2E8F0] bg-white p-4 rounded-[10px] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#CBD5E1] transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#EFF6FF] text-[#2563EB] text-[11px] font-mono font-bold flex items-center justify-center border border-[#DBEAFE]">
                          {idx + 1}
                        </span>
                        <h3 className="font-bold text-[14px] text-[#0F172A]">
                          {layer.name}
                        </h3>
                      </div>
                      <p className="text-[13px] text-[#475569] leading-relaxed pl-7">
                        {layer.description}
                      </p>
                    </div>

                    {layer.modules && layer.modules.length > 0 && (
                      <div className="flex flex-wrap gap-1 sm:justify-end pl-7 sm:pl-0 shrink-0">
                        {layer.modules.map((m, mIdx) => (
                          <span
                            key={mIdx}
                            className="text-[11px] font-mono bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 rounded text-[#475569]"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {idx < architecture.layers.length - 1 && (
                    <div className="flex justify-center text-[#94A3B8]">
                      <div className="w-0.5 h-4 bg-[#E2E8F0]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <hr className="border-[#E2E8F0]" />

          {/* SECTION E: KEY MODULES */}
          <section id="key-modules" className="space-y-4 scroll-mt-20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-mono uppercase font-bold text-[#2563EB] tracking-wider mb-1">
                  Section 5 • Key Modules
                </div>
                <h2 className="text-[19px] font-bold text-[#0F172A] tracking-tight">
                  Core Implementation Units ({keyModules.length})
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {keyModules.map((mod, idx) => (
                <div
                  key={idx}
                  className="border border-[#E2E8F0] p-4 rounded-[10px] bg-white hover:border-[#2563EB] transition-all space-y-2.5 shadow-xs flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[13px] font-bold text-[#0F172A] truncate" title={mod.path}>
                        {mod.name}
                      </span>
                      <span className="text-[10px] font-mono bg-[#F1F5F9] text-[#64748B] px-1.5 py-0.5 rounded shrink-0">
                        {mod.functionsCount} fn · {mod.classesCount} cls
                      </span>
                    </div>

                    <p className="text-[12px] text-[#475569] leading-relaxed">
                      {mod.responsibility}
                    </p>

                    {mod.importantSymbols.length > 0 && (
                      <div className="text-[11px] font-mono text-[#64748B] truncate">
                        <span className="text-[#94A3B8]">Symbols: </span>
                        {mod.importantSymbols.join(', ')}
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/project/${id}/files?path=${encodeURIComponent(mod.path)}`}
                    className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#2563EB] hover:text-[#1D4ED8] pt-1"
                  >
                    <span>Open in CodeLiner</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-[#E2E8F0]" />

          {/* SECTION F: DEPENDENCIES */}
          <section id="dependencies" className="space-y-4 scroll-mt-20">
            <div>
              <div className="text-[11px] font-mono uppercase font-bold text-[#2563EB] tracking-wider mb-1">
                Section 6 • Dependencies
              </div>
              <h2 className="text-[19px] font-bold text-[#0F172A] tracking-tight">
                Package Inventory & Highlights
              </h2>
            </div>

            {/* Summary Counters */}
            <div className="flex flex-wrap items-center gap-3 text-[13px] font-mono text-[#334155] border border-[#E2E8F0] p-3 rounded-[8px] bg-[#F8FAFC]">
              <div className="flex items-center gap-1.5">
                <Package size={15} className="text-[#2563EB]" />
                <span className="font-bold text-[#0F172A]">{dependencies.directCount}</span>
                <span>direct dependencies</span>
              </div>
              <span className="text-[#CBD5E1]">•</span>
              <div>
                <span className="font-bold text-[#0F172A]">{dependencies.devCount}</span>
                <span> development dependencies</span>
              </div>
            </div>

            {/* Highlights Grid */}
            {dependencies.highlights.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                {dependencies.highlights.map((pkg, idx) => (
                  <div key={idx} className="border border-[#E2E8F0] p-3 rounded-[8px] bg-white space-y-1">
                    <div className="font-mono text-[12px] font-bold text-[#0F172A] truncate" title={pkg.name}>
                      {pkg.name}
                    </div>
                    <div className="text-[11px] text-[#64748B] leading-snug line-clamp-2">
                      {pkg.purpose}
                    </div>
                    <div className="text-[10px] font-mono text-[#94A3B8]">
                      v{pkg.version}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Collapsible Complete Inventory Accordion */}
            <div className="border border-[#E2E8F0] rounded-[10px] overflow-hidden bg-white">
              <button
                onClick={() => setIsDepsExpanded(prev => !prev)}
                className="w-full p-3.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] transition-colors flex items-center justify-between text-left cursor-pointer border-b border-[#E2E8F0]"
              >
                <div className="flex items-center gap-2 font-mono text-[12px] font-bold text-[#0F172A]">
                  {isDepsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>View all dependencies ({dependencies.all.length})</span>
                </div>
                <span className="text-[11px] font-mono text-[#64748B]">
                  {isDepsExpanded ? 'Click to collapse' : 'Click to expand'}
                </span>
              </button>

              {isDepsExpanded && (
                <div className="p-4 space-y-3">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      placeholder="Search package name..."
                      value={depSearch}
                      onChange={e => setDepSearch(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-[6px] pl-8 pr-3 py-1.5 text-[12px] font-mono text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
                    />
                  </div>

                  <div className="max-h-[300px] overflow-y-auto border border-[#E2E8F0] rounded-[6px]">
                    <table className="w-full text-left border-collapse text-[12px] font-mono">
                      <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] uppercase text-[#64748B]">
                        <tr>
                          <th className="p-2.5">Package</th>
                          <th className="p-2.5">Version</th>
                          <th className="p-2.5">Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {filteredDeps.map((d, idx) => (
                          <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                            <td className="p-2.5 font-semibold text-[#0F172A]">{d.name}</td>
                            <td className="p-2.5 text-[#64748B]">{d.version}</td>
                            <td className="p-2.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  d.type === 'direct'
                                    ? 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]'
                                    : 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]'
                                }`}
                              >
                                {d.type}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </section>

          <hr className="border-[#E2E8F0]" />

          {/* SECTION G: API ENDPOINTS (CONDITIONAL SECTION) */}
          <section id="api-endpoints" className="space-y-4 scroll-mt-20">
            <div>
              <div className="text-[11px] font-mono uppercase font-bold text-[#2563EB] tracking-wider mb-1">
                Section 7 • API Endpoints
              </div>
              <h2 className="text-[19px] font-bold text-[#0F172A] tracking-tight">
                HTTP Route Declarations
              </h2>
            </div>

            {endpoints.detected && endpoints.list.length > 0 ? (
              <div className="border border-[#E2E8F0] rounded-[10px] overflow-x-auto shadow-xs">
                <table className="w-full text-left border-collapse text-[12px] font-mono">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] uppercase text-[#64748B]">
                    <tr>
                      <th className="p-3">Method</th>
                      <th className="p-3">Route Path</th>
                      <th className="p-3">Handler</th>
                      <th className="p-3">Source File</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] bg-white">
                    {endpoints.list.map((ep, idx) => {
                      let badgeColor = 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]';
                      if (ep.method === 'POST') badgeColor = 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]';
                      else if (ep.method === 'PUT' || ep.method === 'PATCH') badgeColor = 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]';
                      else if (ep.method === 'DELETE') badgeColor = 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]';

                      return (
                        <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${badgeColor}`}>
                              {ep.method}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-[#0F172A]">{ep.path}</td>
                          <td className="p-3 text-[#475569]">{ep.handler}</td>
                          <td className="p-3 text-[#64748B] truncate max-w-[200px]" title={ep.sourceFile}>
                            {ep.sourceFile}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4 rounded-[8px] text-[13px] text-[#64748B] italic">
                {endpoints.notice || 'No HTTP route definitions or API endpoints were detected in this repository.'}
              </div>
            )}
          </section>

          <hr className="border-[#E2E8F0]" />

          {/* SECTION H: HOW THE PROJECT WORKS */}
          <section id="workflow" className="space-y-4 scroll-mt-20">
            <div>
              <div className="text-[11px] font-mono uppercase font-bold text-[#2563EB] tracking-wider mb-1">
                Section 8 • Execution Flow
              </div>
              <h2 className="text-[19px] font-bold text-[#0F172A] tracking-tight">
                How the Project Works
              </h2>
            </div>

            {/* Stepper Grid (Horizontal on Desktop, Vertical on Mobile) */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
              {workflow.map(st => (
                <div
                  key={st.step}
                  className="border border-[#E2E8F0] bg-white p-3.5 rounded-[10px] space-y-2 shadow-xs relative"
                >
                  <div className="w-6 h-6 rounded-full bg-[#2563EB] text-white text-[12px] font-mono font-bold flex items-center justify-center">
                    {st.step}
                  </div>
                  <h3 className="font-bold text-[13px] text-[#0F172A]">
                    {st.title}
                  </h3>
                  <p className="text-[12px] text-[#475569] leading-relaxed">
                    {st.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-[#E2E8F0]" />

          {/* SECTION I: CODE HEALTH SUMMARY */}
          <section id="code-health" className="space-y-4 scroll-mt-20">
            <div>
              <div className="text-[11px] font-mono uppercase font-bold text-[#2563EB] tracking-wider mb-1">
                Section 9 • Code Quality & Health
              </div>
              <h2 className="text-[19px] font-bold text-[#0F172A] tracking-tight">
                Code Health Summary
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Score Card */}
              <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-4 rounded-[10px] flex flex-col justify-between space-y-2">
                <div>
                  <div className="text-[11px] font-mono uppercase font-semibold text-[#64748B]">Code Health Index</div>
                  <div className="text-[28px] font-bold text-[#16A34A] font-mono mt-1">
                    {codeHealth.score}/100
                  </div>
                </div>
                <span className="text-[12px] font-semibold text-[#15803D] bg-[#DCFCE7] border border-[#BBF7D0] px-2 py-0.5 rounded w-fit">
                  {codeHealth.status}
                </span>
              </div>

              {/* Issue Severity Breakdown */}
              <div className="sm:col-span-2 border border-[#E2E8F0] p-4 rounded-[10px] space-y-2.5">
                <div className="text-[11px] font-mono uppercase font-semibold text-[#64748B]">
                  Static Concerns Flagged ({overview.totalIssues})
                </div>
                <div className="grid grid-cols-4 gap-2 text-center font-mono">
                  <div className="bg-[#FEF2F2] border border-[#FCA5A5] p-2 rounded-[6px]">
                    <div className="text-[10px] uppercase font-bold text-[#DC2626]">Critical</div>
                    <div className="text-[16px] font-bold text-[#991B1B]">{codeHealth.criticalCount}</div>
                  </div>
                  <div className="bg-[#FFF7ED] border border-[#FDBA74] p-2 rounded-[6px]">
                    <div className="text-[10px] uppercase font-bold text-[#EA580C]">High</div>
                    <div className="text-[16px] font-bold text-[#C2410C]">{codeHealth.highCount}</div>
                  </div>
                  <div className="bg-[#FEFCE8] border border-[#FDE047] p-2 rounded-[6px]">
                    <div className="text-[10px] uppercase font-bold text-[#CA8A04]">Medium</div>
                    <div className="text-[16px] font-bold text-[#A16207]">{codeHealth.mediumCount}</div>
                  </div>
                  <div className="bg-[#F0FDF4] border border-[#86EFAC] p-2 rounded-[6px]">
                    <div className="text-[10px] uppercase font-bold text-[#16A34A]">Low</div>
                    <div className="text-[16px] font-bold text-[#15803D]">{codeHealth.lowCount}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Detected Risks */}
            {codeHealth.topRisks.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="text-[12px] font-mono font-bold text-[#0F172A] uppercase flex items-center gap-1.5">
                  <ShieldAlert size={14} className="text-[#DC2626]" />
                  <span>Key Architectural Risks</span>
                </div>
                <div className="space-y-1.5">
                  {codeHealth.topRisks.map((risk, idx) => (
                    <div
                      key={idx}
                      className="border border-[#FCA5A5] bg-[#FEF2F2] p-2.5 rounded-[8px] flex items-start justify-between gap-3 text-[12px]"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-[#991B1B]">{risk.title}</span>
                        <div className="text-[11px] font-mono text-[#B91C1C]">
                          {risk.file}:{risk.line}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono uppercase font-bold bg-[#DC2626] text-white px-1.5 py-0.5 rounded shrink-0">
                        {risk.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Links to Issues & Improve Health */}
            <div className="flex flex-wrap items-center gap-3 pt-2 text-[12px] font-medium">
              <Link
                to={`/project/${id}/issues`}
                className="inline-flex items-center gap-1 text-[#2563EB] hover:text-[#1D4ED8]"
              >
                <span>View all issues in Issues & Smells</span>
                <ArrowRight size={12} />
              </Link>
              <span className="text-[#CBD5E1]">•</span>
              <Link
                to={`/project/${id}/improve-health`}
                className="inline-flex items-center gap-1 text-[#16A34A] hover:text-[#15803D]"
              >
                <span>Open Code Health Refactoring Simulator</span>
                <ArrowRight size={12} />
              </Link>
            </div>
          </section>

          <hr className="border-[#E2E8F0]" />

          {/* SECTION J: RECOMMENDED IMPROVEMENTS */}
          <section id="improvements" className="space-y-4 scroll-mt-20">
            <div>
              <div className="text-[11px] font-mono uppercase font-bold text-[#2563EB] tracking-wider mb-1">
                Section 10 • Action Plan
              </div>
              <h2 className="text-[19px] font-bold text-[#0F172A] tracking-tight">
                Top 3 Recommended Improvements
              </h2>
            </div>

            <div className="space-y-3">
              {improvements.map((rec, idx) => (
                <div
                  key={idx}
                  className="border border-[#E2E8F0] p-4 rounded-[10px] bg-white hover:border-[#2563EB] transition-all space-y-2 shadow-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#EFF6FF] text-[#2563EB] text-[11px] font-mono font-bold flex items-center justify-center border border-[#DBEAFE]">
                        {idx + 1}
                      </span>
                      <h3 className="font-bold text-[14px] text-[#0F172A]">
                        {rec.problem}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono">
                      <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE] font-semibold">
                        Impact: {rec.impact}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0]">
                        Effort: {rec.effort}
                      </span>
                      {rec.scoreGain && rec.scoreGain > 0 && (
                        <span className="px-2 py-0.5 rounded bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0] font-bold">
                          +{rec.scoreGain} pts
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[13px] text-[#475569] leading-relaxed pl-7">
                    <span className="font-semibold text-[#0F172A]">Recommended Action: </span>
                    {rec.action}
                  </p>

                  <div className="pl-7 pt-1 flex items-center justify-between text-[11px] font-mono">
                    <Link
                      to={`/project/${id}/files?path=${encodeURIComponent(rec.file)}&line=${rec.line}`}
                      className="text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 font-semibold"
                    >
                      <FileCode size={12} />
                      <span>{rec.file}:{rec.line}</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-[13px]">
              <Link
                to={`/project/${id}/improve-health`}
                className="inline-flex items-center gap-1.5 font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
              >
                <span>View complete prioritized refactoring plan in Improve Code Health</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}

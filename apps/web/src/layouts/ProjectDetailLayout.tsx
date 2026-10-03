import { useState, useEffect, createContext, useContext } from 'react';
import { useParams, Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { Search, Sparkles, Command, ArrowLeft } from 'lucide-react';
import CommandPaletteModal from '../components/common/CommandPaletteModal';
import AIChatDrawer from '../components/common/AIChatDrawer';
import { FileMetadata, CodeIssue } from '../types';

interface Project {
  _id: string;
  name: string;
  description?: string;
  status: string;
  languages: string[];
  frameworks: string[];
  stats: {
    totalFiles: number;
    totalLines: number;
    totalFunctions: number;
    totalClasses: number;
    totalIssues: number;
  };
}

interface ProjectContextType {
  project: Project | null;
  files: FileMetadata[];
  issues: CodeIssue[];
  loading: boolean;
  refreshProject: () => Promise<void>;
  openSearch: () => void;
  openChat: () => void;
  openChatWithContext: (query: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within a ProjectProvider');
  return context;
};

export default function ProjectDetailLayout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [issues, setIssues] = useState<CodeIssue[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState<string | undefined>(undefined);

  const fetchProjectData = async () => {
    if (!id) return;
    try {
      const [projectData, filesData, issuesData] = await Promise.all([
        projectService.getProjectById(id),
        projectService.getFiles(id).catch(() => []),
        projectService.getIssues(id).catch(() => []),
      ]);
      setProject(projectData);
      setFiles(filesData);
      setIssues(issuesData);
    } catch (err) {
      console.error('Failed to load project details:', err);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const openChatWithContext = (query: string) => {
    setChatQuery(query);
    setIsChatOpen(true);
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  // Global shortcut for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#F8FAFC] flex flex-col items-center justify-center font-mono text-[13px] text-[#64748B] space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
        <span>Loading workspace data...</span>
      </div>
    );
  }

  const navItems = [
    { label: 'Overview', path: 'overview' },
    { label: 'Files & Code', path: 'files' },
    { label: 'Architecture Graph', path: 'architecture' },
    { label: 'Dependencies', path: 'dependencies' },
    { label: 'Issues & Smells', path: 'issues' },
    { label: 'Documentation', path: 'documentation' },
    { label: 'Improve Code Health', path: 'improve-health' },
  ];

  return (
    <ProjectContext.Provider 
      value={{ 
        project, 
        files, 
        issues,
        loading, 
        refreshProject: fetchProjectData,
        openSearch: () => setIsSearchOpen(true),
        openChat: () => {
          setChatQuery(undefined);
          setIsChatOpen(true);
        },
        openChatWithContext,
      }}
    >
      <div className="h-screen w-screen bg-[#F8FAFC] flex flex-col font-sans text-[#0F172A] overflow-hidden select-none">
        
        {/* Top Header: 56px */}
        <header className="h-14 px-6 flex justify-between items-center border-b border-[#E2E8F0] bg-white z-20 shrink-0">
          
          {/* Left Breadcrumbs */}
          <div className="flex items-center gap-3">
            <Link 
              to="/dashboard" 
              className="p-1.5 rounded-[6px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors" 
              title="Back to Dashboard"
            >
              <ArrowLeft size={16} />
            </Link>

            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-6 h-6 rounded-[6px] bg-[#EFF6FF] text-[#2563EB] font-mono text-xs font-bold flex items-center justify-center border border-[#DBEAFE]">
                &lt;/&gt;
              </div>
              <span className="font-bold text-[15px] text-[#0F172A] tracking-tight">
                Code<span className="text-[#2563EB]">Liner</span>
              </span>
            </Link>

            <span className="text-[#CBD5E1]">/</span>

            <span className="text-[13px] font-semibold font-mono text-[#2563EB] px-2.5 py-0.5 rounded-[6px] bg-[#EFF6FF] border border-[#DBEAFE] max-w-[200px] truncate">
              {project?.name}
            </span>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Quick Finder Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-3 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] hover:border-[#CBD5E1] px-3 py-1.5 rounded-[8px] text-[13px] text-[#64748B] hover:text-[#0F172A] transition-all"
            >
              <div className="flex items-center gap-1.5">
                <Search size={14} className="text-[#94A3B8]" />
                <span className="hidden sm:inline text-[12px]">Search symbols & files...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono font-medium bg-white border border-[#CBD5E1] px-1.5 py-0.5 rounded-[4px] text-[#475569] shadow-xs">
                <Command size={10} /> K
              </kbd>
            </button>

            {/* Ask AI Codebase Assistant Button (Violet Accent Spec #6) */}
            <button
              onClick={() => setIsChatOpen(true)}
              className="flex items-center gap-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[13px] font-medium px-3.5 py-1.5 rounded-[8px] shadow-xs transition-colors"
            >
              <Sparkles size={14} />
              <span>Ask AI</span>
            </button>
          </div>
        </header>

        {/* Workspace Navigation Subtabs */}
        <nav className="h-11 px-6 border-b border-[#E2E8F0] bg-white flex gap-8 text-[13px] font-medium overflow-x-auto shrink-0">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={`/project/${id}/${item.path}`}
              className={({ isActive }) =>
                `h-full flex items-center border-b-2 transition-all ${
                  isActive 
                    ? 'border-[#2563EB] text-[#2563EB] font-semibold' 
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Content Viewport */}
        <main className="flex-1 min-h-0 w-full relative overflow-hidden flex flex-col bg-[#F8FAFC]">
          <Outlet />
        </main>

        {/* Modals & Drawers */}
        <CommandPaletteModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          files={files}
        />

        <AIChatDrawer
          isOpen={isChatOpen}
          onClose={() => {
            setIsChatOpen(false);
            setChatQuery(undefined);
          }}
          projectName={project?.name || 'Codebase'}
          initialQuery={chatQuery}
        />
      </div>
    </ProjectContext.Provider>
  );
}

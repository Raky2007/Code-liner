import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { projectService } from '../services/projectService';
import { Navbar } from '../components/common/Navbar';
import { UploadZone } from '../components/common/UploadZone';
import { 
  Plus, 
  Trash2, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Files, 
  Code2, 
  Bug, 
  ArrowRight, 
  FolderGit2
} from 'lucide-react';

interface Project {
  _id: string;
  name: string;
  description?: string;
  status: string;
  error?: string;
  stats?: {
    totalFiles: number;
    totalLines: number;
    totalIssues: number;
  };
  createdAt: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // New Project Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  // Uploading Modal State
  const [activeUploadProject, setActiveUploadProject] = useState<Project | null>(null);
  const [isProcessingModal, setIsProcessingModal] = useState(false);
  const [modalActiveStep, setModalActiveStep] = useState(0);

  const fetchProjects = async () => {
    try {
      const data = await apiFetch('/api/projects');
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Poll status of non-finished projects
  useEffect(() => {
    const activePolls = projects.filter(
      p => p.status !== 'COMPLETED' && p.status !== 'FAILED'
    );

    if (activePolls.length === 0) return;

    const interval = setInterval(async () => {
      let updated = false;
      const nextProjects = await Promise.all(
        projects.map(async p => {
          if (p.status !== 'COMPLETED' && p.status !== 'FAILED') {
            try {
              const statusData = await apiFetch(`/api/projects/${p._id}/status`);
              if (statusData.status !== p.status) {
                updated = true;
                if (statusData.status === 'COMPLETED' || statusData.status === 'FAILED') {
                  const fullProject = await apiFetch(`/api/projects/${p._id}`);
                  return fullProject;
                }
                return { ...p, status: statusData.status, error: statusData.error };
              }
            } catch (err) {
              console.error(`Error polling status for ${p._id}:`, err);
            }
          }
          return p;
        })
      );

      if (updated) {
        setProjects(nextProjects);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [projects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Project name is required.');
      return;
    }

    setFormError('');
    setCreating(true);

    try {
      const p = await projectService.createProject(name.trim(), description.trim());
      setProjects([p, ...projects]);
      setActiveUploadProject(p); // Auto-open upload dialog for new project
      setName('');
      setDescription('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create project.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project and all its analysis results?')) return;

    try {
      await apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
      setProjects(projects.filter(p => p._id !== id));
      if (activeUploadProject?._id === id) setActiveUploadProject(null);
    } catch (err) {
      alert('Failed to delete project.');
    }
  };

  const handleModalUpload = async (file: File) => {
    if (!activeUploadProject) return;
    try {
      setIsProcessingModal(true);
      setModalActiveStep(0);

      await projectService.uploadProject(activeUploadProject._id, file);

      // Update project status in list immediately
      setProjects(
        projects.map(p => (p._id === activeUploadProject._id ? { ...p, status: 'VALIDATING' } : p))
      );

      setModalActiveStep(1);

      // Poll until completed
      const poll = setInterval(async () => {
        try {
          const statusRes = await projectService.getProjectStatus(activeUploadProject._id);
          if (statusRes.status === 'EXTRACTING' || statusRes.status === 'SCANNING') setModalActiveStep(0);
          if (statusRes.status === 'DETECTING') setModalActiveStep(1);
          if (statusRes.status === 'PARSING') setModalActiveStep(2);
          if (statusRes.status === 'ANALYZING') setModalActiveStep(3);
          if (statusRes.status === 'COMPLETED') {
            clearInterval(poll);
            setModalActiveStep(4);
            setTimeout(() => {
              setIsProcessingModal(false);
              const targetId = activeUploadProject._id;
              setActiveUploadProject(null);
              navigate(`/project/${targetId}/overview`);
            }, 600);
          } else if (statusRes.status === 'FAILED') {
            clearInterval(poll);
            setIsProcessingModal(false);
            alert(`Analysis failed: ${statusRes.error || 'Unknown error'}`);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 1500);

    } catch (err: any) {
      setIsProcessingModal(false);
      throw new Error(err.message || 'Upload failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#DBEAFE] selection:text-[#2563EB]">
      {/* 72px Navbar */}
      <Navbar />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-12 py-10">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-[#E2E8F0]">
          <div>
            <h1 className="text-[28px] font-bold text-[#0F172A] tracking-[-0.02em]">
              Projects & Workspaces
            </h1>
            <p className="text-[14px] text-[#475569] mt-1">
              Select an ingested repository to explore its architecture, AST symbols, and AI analysis.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[13px] font-mono text-[#64748B] bg-white px-3 py-1.5 rounded-[6px] border border-[#E2E8F0]">
              {projects.length} {projects.length === 1 ? 'Repository' : 'Repositories'}
            </span>
          </div>
        </div>

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          
          {/* Left Column: Create Project Form */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-card sticky top-28">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-[6px] bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center">
                  <Plus size={16} />
                </div>
                <h2 className="text-[16px] font-semibold text-[#0F172A]">
                  New Workspace
                </h2>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4">
                {formError && (
                  <div className="bg-[#FEE2E2] border border-[#FECACA] text-[#DC2626] text-[13px] p-3 rounded-[8px]">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-[12px] font-mono uppercase tracking-wider font-semibold text-[#475569] mb-1.5">
                    Project Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. backend-api-service"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="w-full h-10 px-3.5 bg-white border border-[#E2E8F0] rounded-[8px] text-[14px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-mono uppercase tracking-wider font-semibold text-[#475569] mb-1.5">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Brief architectural overview or repository purpose"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full p-3 bg-white border border-[#E2E8F0] rounded-[8px] text-[14px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full h-10 bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] disabled:opacity-50 text-white rounded-[8px] font-medium text-[14px] flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Plus size={16} />
                  <span>{creating ? 'Creating Workspace...' : 'Create & Upload ZIP'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Ingested Projects List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-12 text-center shadow-card">
                <Loader2 size={24} className="animate-spin text-[#2563EB] mx-auto mb-3" />
                <p className="text-[14px] text-[#64748B] font-mono">Loading ingested repositories...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-[#CBD5E1] rounded-[16px] p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-[12px] bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mx-auto">
                  <FolderGit2 size={28} />
                </div>
                <div>
                  <h3 className="text-[18px] font-semibold text-[#0F172A]">
                    No projects analyzed yet
                  </h3>
                  <p className="text-[14px] text-[#475569] mt-1 max-w-sm mx-auto">
                    Create a project on the left or drop a repository ZIP archive to start deep architectural intelligence.
                  </p>
                </div>
              </div>
            ) : (
              projects.map(project => {
                const isFinished = project.status === 'COMPLETED';
                const isFailed = project.status === 'FAILED';
                const isAnalyzing = !isFinished && !isFailed && project.status !== 'UPLOADING';

                return (
                  <div
                    key={project._id}
                    onClick={() => isFinished && navigate(`/project/${project._id}/overview`)}
                    className={`bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-card transition-all duration-200 ${
                      isFinished
                        ? 'hover:border-[#CBD5E1] hover:shadow-card-hover cursor-pointer group'
                        : 'opacity-95'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3">
                          <h3 className="text-[17px] font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors truncate">
                            {project.name}
                          </h3>

                          {/* Status Badge with Icon + Text + Color (Spec #33) */}
                          {isFinished ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] text-[11px] font-mono font-medium shrink-0">
                              <CheckCircle2 size={12} />
                              Completed
                            </span>
                          ) : isFailed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] text-[11px] font-mono font-medium shrink-0">
                              <AlertCircle size={12} />
                              Failed
                            </span>
                          ) : isAnalyzing ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] text-[11px] font-mono font-medium shrink-0">
                              <Loader2 size={12} className="animate-spin" />
                              {project.status}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[4px] bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0] text-[11px] font-mono font-medium shrink-0">
                              Waiting for ZIP
                            </span>
                          )}
                        </div>

                        {project.description && (
                          <p className="text-[13px] text-[#475569] mt-1 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono text-[#94A3B8]">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                        <button
                          onClick={e => handleDeleteProject(project._id, e)}
                          className="p-1.5 text-[#64748B] hover:text-[#DC2626] hover:bg-[#FEE2E2] rounded-[6px] transition-colors"
                          title="Delete Project"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Footer Metrics / Action Strip */}
                    <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
                      {isFinished ? (
                        <div className="flex items-center gap-4 text-[12px] font-mono text-[#64748B]">
                          <span className="flex items-center gap-1.5">
                            <Files size={13} className="text-[#2563EB]" />
                            <strong className="text-[#0F172A]">{project.stats?.totalFiles || 0}</strong> Files
                          </span>
                          <span className="text-[#E2E8F0]">|</span>
                          <span className="flex items-center gap-1.5">
                            <Code2 size={13} className="text-[#06B6D4]" />
                            <strong className="text-[#0F172A]">{project.stats?.totalLines || 0}</strong> Lines
                          </span>
                          <span className="text-[#E2E8F0]">|</span>
                          <span className="flex items-center gap-1.5">
                            <Bug size={13} className="text-[#D97706]" />
                            <strong className="text-[#0F172A]">{project.stats?.totalIssues || 0}</strong> Issues
                          </span>
                        </div>
                      ) : isFailed ? (
                        <span className="text-[12px] text-[#DC2626] font-mono truncate max-w-md">
                          Error: {project.error || 'Parsing failed'}
                        </span>
                      ) : (
                        <div className="flex items-center gap-2 text-[12px] font-mono text-[#2563EB]">
                          <Loader2 size={13} className="animate-spin" />
                          <span>Pipeline processing AST & dependency graphs...</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {project.status === 'UPLOADING' && (
                          <button
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveUploadProject(project);
                            }}
                            className="h-8 px-3 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[12px] font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                          >
                            <Upload size={12} />
                            <span>Upload ZIP</span>
                          </button>
                        )}

                        {isFailed && (
                          <button
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveUploadProject(project);
                            }}
                            className="h-8 px-3 rounded-[6px] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#0F172A] text-[12px] font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <Upload size={12} />
                            <span>Retry Upload</span>
                          </button>
                        )}

                        {isFinished && (
                          <span className="text-[13px] font-medium text-[#2563EB] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                            <span>Open Explorer</span>
                            <ArrowRight size={14} />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Upload ZIP Overlay Modal */}
      {activeUploadProject && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] max-w-xl w-full p-6 shadow-dropdown space-y-6">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
              <div>
                <h3 className="text-[17px] font-semibold text-[#0F172A]">
                  Upload Codebase Package
                </h3>
                <p className="text-[13px] font-mono text-[#64748B] mt-0.5">
                  Target: {activeUploadProject.name}
                </p>
              </div>

              {!isProcessingModal && (
                <button
                  onClick={() => setActiveUploadProject(null)}
                  className="text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] px-2 py-1 rounded-[6px] transition-colors"
                >
                  Close
                </button>
              )}
            </div>

            {/* Reusable Upload Zone */}
            <UploadZone
              onUploadSubmit={handleModalUpload}
              isProcessing={isProcessingModal}
              activeStep={modalActiveStep}
              defaultProjectName={activeUploadProject.name}
            />
          </div>
        </div>
      )}
    </div>
  );
}

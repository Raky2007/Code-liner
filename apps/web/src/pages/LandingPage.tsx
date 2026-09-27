import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { UploadZone } from '../components/common/UploadZone';
import { CodebaseAnalysisHeroVisual } from '../components/common/CodebaseAnalysisHeroVisual';
import { LogViewer } from '../components/common/LogViewer';
import { projectService } from '../services/projectService';
import { 
  FolderTree, 
  Workflow, 
  Code2, 
  Network, 
  Sparkles, 
  ShieldCheck, 
  Terminal, 
  ArrowRight
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const scrollToUpload = () => {
    const el = document.getElementById('upload-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLandingUpload = async (file: File, projectName: string) => {
    try {
      setIsProcessing(true);
      setActiveStep(0); // Extracting archive

      // Step 1: Create project on backend
      const project = await projectService.createProject(projectName, 'Uploaded via Code-Liner Web Interface');
      
      setActiveStep(1); // Detecting technologies

      // Step 2: Upload ZIP
      await projectService.uploadProject(project._id, file);

      setActiveStep(2); // Mapping dependencies

      // Step 3: Poll status until COMPLETED or FAILED
      let attempts = 0;
      const maxAttempts = 600; // 15 minutes safety ceiling
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const statusRes = await projectService.getProjectStatus(project._id);
          
          if (statusRes.status === 'EXTRACTING' || statusRes.status === 'SCANNING') {
            setActiveStep(0);
          } else if (statusRes.status === 'DETECTING') {
            setActiveStep(1);
          } else if (statusRes.status === 'PARSING') {
            setActiveStep(2);
          } else if (statusRes.status === 'ANALYZING') {
            setActiveStep(3);
          } else if (statusRes.status === 'COMPLETED') {
            clearInterval(pollInterval);
            setActiveStep(4);
            setTimeout(() => {
              navigate(`/project/${project._id}/overview`);
            }, 600);
          } else if (statusRes.status === 'FAILED') {
            clearInterval(pollInterval);
            setIsProcessing(false);
            alert(`Analysis failed: ${statusRes.error || 'Server error occurred during processing.'}`);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setIsProcessing(false);
            alert('Analysis is taking longer than expected. Please check your Dashboard to view progress.');
          }
        } catch (err) {
          console.error('Error polling status:', err);
        }
      }, 1500);

    } catch (err: any) {
      setIsProcessing(false);
      throw new Error(err.message || 'Failed to upload and analyze project.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#DBEAFE] selection:text-[#2563EB]">
      {/* 72px Glassmorphism Blur Navbar */}
      <Navbar onAnalyzeClick={scrollToUpload} />

      {/* Hero Section with Technical Grid */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-6 lg:px-12 bg-tech-grid bg-radial-glow border-b border-[#E2E8F0] overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          
          {/* Subtle badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] bg-white border border-[#E2E8F0] shadow-xs text-[12px] font-mono text-[#475569] mb-8">
            <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse" />
            <span>Code-Liner v2.4 Engine // 500MB Archive Processing</span>
          </div>

          {/* Hero Heading: 64px Desktop, Weight 700, -0.04em */}
          <h1 className="text-4xl sm:text-5xl md:text-[64px] font-bold text-[#0F172A] leading-[1.05] tracking-[-0.04em] max-w-4xl mx-auto">
            Understand Any Codebase.
          </h1>

          {/* Hero Subtitle: 20px Desktop, Color #475569 */}
          <p className="text-lg md:text-[20px] text-[#475569] leading-[1.6] max-w-[650px] mx-auto mt-6">
            Upload your project ZIP and let Code-Liner explain the architecture, files, logic, dependencies, and execution flow — automatically.
          </p>

          {/* Hero Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <button
              onClick={scrollToUpload}
              className="h-11 px-6 rounded-[8px] bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white font-medium text-[15px] inline-flex items-center gap-2 shadow-xs transition-colors"
            >
              <span>Analyze Your Code</span>
              <ArrowRight size={16} />
            </button>

            <a
              href="#how-it-works"
              className="h-11 px-6 rounded-[8px] bg-white hover:bg-[#F8FAFC] text-[#0F172A] border border-[#CBD5E1] font-medium text-[15px] inline-flex items-center gap-2 transition-colors shadow-xs"
            >
              <span>See How It Works</span>
            </a>
          </div>

          {/* Hero Codebase Analysis Visual Flow */}
          <CodebaseAnalysisHeroVisual />
        </div>
      </section>

      {/* Upload Component Section (Design System Spec #15) */}
      <section id="upload-section" className="py-20 px-6 lg:px-12 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <div className="inline-flex items-center gap-2 text-[#2563EB] text-[12px] font-mono uppercase tracking-wider font-semibold mb-2">
            <span>Direct Ingestion</span>
          </div>
          <h2 className="text-3xl md:text-[40px] font-bold text-[#0F172A] tracking-[-0.02em] leading-[1.15]">
            Upload your code. Understand everything.
          </h2>
          <p className="text-[16px] text-[#475569] mt-3 max-w-xl mx-auto">
            Drop any JavaScript, TypeScript, Python, Go, Rust, Java, or polyglot repository archive up to 500MB.
          </p>
        </div>

        {/* The 16px Radius Drag-and-Drop Component */}
        <UploadZone
          onUploadSubmit={handleLandingUpload}
          isProcessing={isProcessing}
          activeStep={activeStep}
        />
      </section>

      {/* How It Works & Architecture Capabilities (Design System Spec #18 - #22) */}
      <section id="how-it-works" className="py-24 px-6 lg:px-12 bg-[#F8FAFC] border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-[12px] font-mono uppercase tracking-wider text-[#2563EB] font-semibold">
              Deep Structural Analysis
            </span>
            <h2 className="text-3xl md:text-[40px] font-bold text-[#0F172A] tracking-[-0.02em] mt-2 leading-[1.15]">
              Everything you need to master unfamiliar code
            </h2>
            <p className="text-[16px] text-[#475569] mt-3">
              Code-Liner combines static AST parsing with targeted LLM reasoning to demystify complex architectures in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-card hover:border-[#CBD5E1] transition-all">
              <div className="w-10 h-10 rounded-[8px] bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-4">
                <FolderTree size={20} />
              </div>
              <h3 className="text-[18px] font-semibold text-[#0F172A] mb-2">
                Project Structure & Files
              </h3>
              <p className="text-[14px] text-[#475569] leading-relaxed">
                VS Code-inspired clean explorer mapping every folder, configuration, and file responsibility with zero noise or clutter.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-card hover:border-[#CBD5E1] transition-all">
              <div className="w-10 h-10 rounded-[8px] bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-4">
                <Workflow size={20} />
              </div>
              <h3 className="text-[18px] font-semibold text-[#0F172A] mb-2">
                Execution Flow & Data Paths
              </h3>
              <p className="text-[14px] text-[#475569] leading-relaxed">
                Trace how incoming requests navigate through controllers, middleware, business logic handlers, and database queries.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-card hover:border-[#CBD5E1] transition-all">
              <div className="w-10 h-10 rounded-[8px] bg-[#CFFAFE] text-[#06B6D4] flex items-center justify-center mb-4">
                <Network size={20} />
              </div>
              <h3 className="text-[18px] font-semibold text-[#0F172A] mb-2">
                Architecture DAG Visualizer
              </h3>
              <p className="text-[14px] text-[#475569] leading-relaxed">
                Explore a high-fidelity interactive dependency graph with archetype filtering (API, UI, Database, Service) and minimap navigation.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-card hover:border-[#CBD5E1] transition-all">
              <div className="w-10 h-10 rounded-[8px] bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center mb-4">
                <Sparkles size={20} />
              </div>
              <h3 className="text-[18px] font-semibold text-[#0F172A] mb-2">
                AI Code Walkthrough
              </h3>
              <p className="text-[14px] text-[#475569] leading-relaxed">
                Instant breakdowns of file purpose, step-by-step logic execution, key function exports, callers, and downstream dependencies.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-card hover:border-[#CBD5E1] transition-all">
              <div className="w-10 h-10 rounded-[8px] bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-4">
                <Code2 size={20} />
              </div>
              <h3 className="text-[18px] font-semibold text-[#0F172A] mb-2">
                Monaco Editor & Side Diff
              </h3>
              <p className="text-[14px] text-[#475569] leading-relaxed">
                Full-featured syntax highlighted editor with symbol trees, line counts, and side-by-side split comparison for AI refactoring proposals.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-card hover:border-[#CBD5E1] transition-all">
              <div className="w-10 h-10 rounded-[8px] bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mb-4">
                <ShieldCheck size={20} />
              </div>
              <h3 className="text-[18px] font-semibold text-[#0F172A] mb-2">
                Code Smells & Risk Audits
              </h3>
              <p className="text-[14px] text-[#475569] leading-relaxed">
                Pinpoint cyclomatic bottlenecks, circular dependencies, oversized modules, and unhandled exceptions before merging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Terminal Telemetry / Logs Section (Design System Spec #24) */}
      <section id="terminal-logs" className="py-20 px-6 lg:px-12 bg-white border-b border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-[#06B6D4] text-[12px] font-mono uppercase tracking-wider font-semibold mb-2">
                <Terminal size={14} />
                <span>Runtime Telemetry</span>
              </div>
              <h2 className="text-2xl md:text-[32px] font-bold text-[#0F172A] tracking-[-0.02em]">
                Transparent, deterministic analysis logs
              </h2>
            </div>
            <p className="text-[14px] text-[#475569] max-w-md">
              Every phase of project extraction, AST tokenization, dependency graphing, and AI synthesis is streamed in real-time.
            </p>
          </div>

          {/* The Terminal Log Viewer */}
          <LogViewer />
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="w-full bg-[#F8FAFC] py-8 px-6 lg:px-12 text-[14px] text-[#64748B]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-[6px] bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] font-mono text-xs font-bold">
              &lt;/&gt;
            </div>
            <span className="font-semibold text-[#0F172A]">CodeLiner</span>
            <span className="text-[#CBD5E1]">|</span>
            <span className="text-[13px]">Software Intelligence Platform</span>
          </div>

          <div className="flex items-center gap-6 text-[13px] font-medium text-[#475569]">
            <Link to="/dashboard" className="hover:text-[#2563EB] transition-colors">
              Dashboard
            </Link>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#2563EB] transition-colors">
              GitHub
            </a>
            <span className="text-[#94A3B8] font-mono text-[12px]">
              &copy; {new Date().getFullYear()} Code-Liner
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

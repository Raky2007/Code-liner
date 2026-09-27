import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Github, ArrowRight, LayoutDashboard } from 'lucide-react';

interface NavbarProps {
  onAnalyzeClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onAnalyzeClick }) => {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/project');

  return (
    <header className="sticky top-0 z-40 w-full h-[72px] bg-white/85 backdrop-blur-[12px] border-b border-[#E2E8F0] px-6 lg:px-12 flex items-center justify-between transition-all">
      {/* Brand Wordmark */}
      <div className="flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-[8px] bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-all duration-200">
            <span className="font-mono text-sm font-bold">&lt;/&gt;</span>
          </div>
          <span className="font-bold text-[18px] text-[#0F172A] tracking-[-0.02em]">
            Code<span className="text-[#2563EB]">Liner</span>
          </span>
        </Link>

        {/* Navigation items */}
        <nav className="hidden md:flex items-center gap-6 text-[14px] font-medium text-[#475569]">
          <a
            href="#product"
            className="hover:text-[#2563EB] transition-colors py-1"
          >
            Product
          </a>
          <a
            href="#how-it-works"
            className="hover:text-[#2563EB] transition-colors py-1"
          >
            How it works
          </a>
          <a
            href="#features"
            className="hover:text-[#2563EB] transition-colors py-1"
          >
            Features
          </a>
          <a
            href="#terminal-logs"
            className="hover:text-[#2563EB] transition-colors py-1"
          >
            Telemetry
          </a>
        </nav>
      </div>

      {/* Right side CTAs */}
      <div className="flex items-center gap-3">
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-[14px] font-medium text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-[8px] transition-colors"
          aria-label="GitHub Repository"
        >
          <Github size={16} />
          <span>GitHub</span>
        </a>

        {isDashboard ? (
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 h-10 px-4 text-[14px] font-medium text-[#0F172A] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] rounded-[8px] transition-colors shadow-xs"
          >
            <LayoutDashboard size={15} className="text-[#2563EB]" />
            <span>Workspace</span>
          </Link>
        ) : (
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 h-10 px-4 text-[14px] font-medium text-[#0F172A] bg-white border border-[#CBD5E1] hover:bg-[#F8FAFC] rounded-[8px] transition-colors shadow-xs"
          >
            <span>Dashboard</span>
          </Link>
        )}

        <button
          onClick={onAnalyzeClick}
          className="inline-flex items-center gap-2 h-10 px-4 text-[14px] font-medium text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] rounded-[8px] transition-colors shadow-xs"
        >
          <span>Get Started</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </header>
  );
};

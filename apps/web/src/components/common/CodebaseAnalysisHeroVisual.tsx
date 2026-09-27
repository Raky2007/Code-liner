import React from 'react';
import { FileArchive, Sparkles, FolderTree, Network, CheckCircle2 } from 'lucide-react';

export const CodebaseAnalysisHeroVisual: React.FC = () => {
  return (
    <div className="w-full max-w-5xl mx-auto mt-12 bg-white rounded-[16px] border border-[#E2E8F0] shadow-card overflow-hidden">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]" />
          </div>
          <span className="text-[12px] font-mono text-[#64748B]">
            code-liner // architecture-pipeline-preview
          </span>
        </div>
        <div className="flex items-center gap-3 text-[12px] font-mono">
          <span className="inline-flex items-center gap-1 text-[#16A34A] bg-[#DCFCE7] px-2 py-0.5 rounded-[4px] font-medium">
            <CheckCircle2 size={12} />
            Pipeline Active
          </span>
          <span className="text-[#64748B]">v2.4.0</span>
        </div>
      </div>

      {/* Visual Pipeline Grid */}
      <div className="p-6 md:p-8 bg-[#F8FAFC]/50 grid grid-cols-1 md:grid-cols-5 gap-4 items-center relative">
        
        {/* Step 1: ZIP Archive */}
        <div className="bg-white border border-[#E2E8F0] hover:border-[#3B82F6] rounded-[12px] p-4 shadow-xs transition-all flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-[10px] bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-3">
            <FileArchive size={24} />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#64748B] font-semibold">
            Input Archive
          </span>
          <span className="text-[13px] font-semibold text-[#0F172A] mt-1 font-mono truncate max-w-full">
            project.zip
          </span>
          <span className="text-[11px] font-mono text-[#94A3B8] mt-0.5">
            500MB max
          </span>
        </div>

        {/* Connector 1 */}
        <div className="hidden md:flex flex-col items-center justify-center">
          <div className="w-full h-[2px] bg-gradient-to-r from-[#CBD5E1] via-[#3B82F6] to-[#CBD5E1] relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
          </div>
          <span className="text-[10px] font-mono text-[#64748B] mt-1">extract</span>
        </div>

        {/* Step 2: Project Structure & AST */}
        <div className="bg-white border border-[#E2E8F0] hover:border-[#3B82F6] rounded-[12px] p-4 shadow-xs transition-all flex flex-col">
          <div className="flex items-center gap-2 mb-2 text-[#2563EB]">
            <FolderTree size={16} />
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#475569]">
              Structure
            </span>
          </div>
          <div className="space-y-1 font-mono text-[11px] text-[#475569] bg-[#F8FAFC] p-2 rounded-[6px] border border-[#E2E8F0]">
            <div className="text-[#2563EB] font-semibold">📁 src/</div>
            <div className="pl-3">📁 services/</div>
            <div className="pl-6 text-[#0F172A]">📄 auth.ts</div>
            <div className="pl-6 text-[#0F172A]">📄 payment.ts</div>
            <div className="pl-3">📁 api/</div>
          </div>
        </div>

        {/* Connector 2 */}
        <div className="hidden md:flex flex-col items-center justify-center">
          <div className="w-full h-[2px] bg-gradient-to-r from-[#CBD5E1] via-[#7C3AED] to-[#CBD5E1] relative">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
          </div>
          <span className="text-[10px] font-mono text-[#64748B] mt-1">analyze</span>
        </div>

        {/* Step 3: AI Explanation & Architecture Graph */}
        <div className="bg-white border border-[#E2E8F0] hover:border-[#7C3AED] rounded-[12px] p-4 shadow-xs transition-all flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[#7C3AED]">
              <Sparkles size={16} />
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#7C3AED]">
                AI Walkthrough
              </span>
            </div>
            <Network size={14} className="text-[#06B6D4]" />
          </div>
          <div className="bg-[#FAF5FF] border border-[#EDE9FE] p-2.5 rounded-[6px] text-[11px] text-[#475569] leading-relaxed">
            <p className="font-semibold text-[#0F172A] font-mono text-[11px]">auth.ts (Handler)</p>
            <p className="text-[11px] text-[#475569] mt-0.5">
              Validates JWT sessions & calls <span className="font-mono text-[#7C3AED]">db.users</span> with rate-limiting.
            </p>
          </div>
        </div>
      </div>

      {/* Architecture DAG mini-diagram */}
      <div className="px-6 py-4 bg-white border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-[13px] font-medium text-[#475569]">
          <span className="text-[#0F172A] font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
            Architecture Topology:
          </span>
          <span className="inline-flex items-center gap-1 font-mono text-[12px] px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded-[4px] border border-[#DBEAFE]">
            Client UI
          </span>
          <span className="text-[#94A3B8]">→</span>
          <span className="inline-flex items-center gap-1 font-mono text-[12px] px-2 py-0.5 bg-[#CFFAFE] text-[#0891B2] rounded-[4px] border border-[#A5F3FC]">
            API Gateway
          </span>
          <span className="text-[#94A3B8]">→</span>
          <span className="inline-flex items-center gap-1 font-mono text-[12px] px-2 py-0.5 bg-[#EDE9FE] text-[#7C3AED] rounded-[4px] border border-[#DDD6FE]">
            Domain Services
          </span>
          <span className="text-[#94A3B8]">→</span>
          <span className="inline-flex items-center gap-1 font-mono text-[12px] px-2 py-0.5 bg-[#F1F5F9] text-[#334155] rounded-[4px] border border-[#E2E8F0]">
            Database
          </span>
        </div>

        <div className="text-[12px] font-mono text-[#64748B]">
          100% Client & Server Sandboxed
        </div>
      </div>
    </div>
  );
};

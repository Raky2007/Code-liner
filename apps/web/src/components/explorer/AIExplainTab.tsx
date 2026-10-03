import React from 'react';
import { Sparkles, FileText, ListOrdered, AlignLeft, RefreshCw } from 'lucide-react';
import { AIExplanation } from '../../types';

interface AIExplainTabProps {
  explanation: AIExplanation | null;
  loading: boolean;
  onExplainCode: () => void;
  onJumpToLine: (line: number) => void;
  hasActiveFile: boolean;
  activeFilePath?: string;
}

export const AIExplainTab: React.FC<AIExplainTabProps> = ({
  explanation,
  loading,
  onExplainCode,
  onJumpToLine,
  hasActiveFile,
  activeFilePath,
}) => {
  return (
    <div className="space-y-4 select-none text-[#0F172A]">
      {!explanation && !loading && (
        <div className="border border-[#E2E8F0] p-6 text-center rounded-[12px] bg-white shadow-xs flex flex-col items-center">
          <div className="w-12 h-12 rounded-[12px] bg-[#EDE9FE] flex items-center justify-center mb-3 text-[#7C3AED]">
            <Sparkles size={22} />
          </div>
          <h5 className="text-[13px] font-bold uppercase tracking-wider text-[#0F172A]">
            AI Code Walkthrough
          </h5>
          <p className="text-[12px] text-[#64748B] mt-1.5 mb-5 leading-relaxed max-w-[260px]">
            Deeply analyze purpose, execution flow, step-by-step logic, and downstream relationships for {activeFilePath?.split('/').pop() || 'this file'}.
          </p>
          <button
            type="button"
            onClick={onExplainCode}
            disabled={!hasActiveFile}
            className="flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2.5 rounded-[8px] text-[12px] font-semibold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Generate Explanation</span>
          </button>
        </div>
      )}

      {loading && (
        <div className="border border-[#E2E8F0] p-8 text-center rounded-[12px] bg-[#F8FAFC] flex flex-col items-center justify-center space-y-3">
          <RefreshCw size={24} className="text-[#7C3AED] animate-spin" />
          <h5 className="text-[13px] font-bold uppercase tracking-wider text-[#0F172A]">
            Synthesizing Code Intelligence...
          </h5>
          <p className="text-[11px] text-[#64748B] leading-relaxed animate-pulse font-mono max-w-[260px]">
            Parsing AST, tracing runtime execution order, and formatting structural insights.
          </p>
        </div>
      )}

      {explanation && !loading && (
        <div className="space-y-4 animate-fadeIn">
          {/* Header & Re-analyze Action */}
          <div className="flex justify-between items-center pb-2 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#7C3AED] uppercase font-semibold">
              <Sparkles size={13} />
              <span>AI Analysis Report</span>
            </div>
            <button
              type="button"
              onClick={onExplainCode}
              className="text-[11px] font-mono text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RefreshCw size={11} /> Re-analyze
            </button>
          </div>

          {/* Architectural Purpose */}
          <section className="space-y-1.5">
            <h4 className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#64748B] flex items-center gap-1.5">
              <FileText size={13} className="text-[#2563EB]" />
              <span>Architectural Purpose</span>
            </h4>
            <div className="border border-[#E2E8F0] bg-white p-3 rounded-[8px] text-[12px] text-[#1E293B] leading-relaxed shadow-xs">
              {explanation.shortDescription}
            </div>
          </section>

          {/* How It Works (Numbered Logic Steps) */}
          {explanation.logicSteps && explanation.logicSteps.length > 0 && (
            <section className="space-y-1.5">
              <h4 className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#64748B] flex items-center gap-1.5">
                <ListOrdered size={13} className="text-[#2563EB]" />
                <span>Execution Flow</span>
              </h4>
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {explanation.logicSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="border border-[#E2E8F0] bg-white p-2.5 rounded-[8px] text-[12px] leading-relaxed flex items-start gap-2 shadow-xs"
                  >
                    <span className="font-mono font-bold text-[#2563EB] text-[11px] shrink-0 w-5">
                      {idx + 1}.
                    </span>
                    <span className="flex-1 text-[#334155]">{step}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Line by line Execution Tracing */}
          {explanation.lineByLine && explanation.lineByLine.length > 0 && (
            <section className="space-y-1.5">
              <h4 className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#64748B] flex items-center gap-1.5">
                <AlignLeft size={13} className="text-[#16A34A]" />
                <span>Line Breakdown</span>
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1">
                {explanation.lineByLine.map((lbl, idx) => (
                  <div
                    key={idx}
                    onClick={() => onJumpToLine(lbl.line)}
                    className="border border-[#E2E8F0] bg-white p-2.5 rounded-[8px] cursor-pointer hover:border-[#3B82F6] hover:bg-[#EFF6FF] flex justify-between gap-3 transition-colors shadow-xs group"
                  >
                    <span className="text-[#334155] leading-relaxed flex-1 group-hover:text-[#1E293B]">
                      {lbl.explanation}
                    </span>
                    <span className="text-[#64748B] font-bold group-hover:text-[#2563EB] shrink-0 bg-[#F8FAFC] border border-[#E2E8F0] px-1.5 py-0.5 rounded">
                      L{lbl.line}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default AIExplainTab;

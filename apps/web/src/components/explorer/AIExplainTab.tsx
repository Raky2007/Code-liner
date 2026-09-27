import React from 'react';
import { Sparkles, FileText, ListOrdered, AlignLeft, RefreshCw } from 'lucide-react';
import { AIExplanation } from '../../types';

interface AIExplainTabProps {
  explanation: AIExplanation | null;
  loading: boolean;
  onExplainCode: () => void;
  onJumpToLine: (line: number) => void;
  hasActiveFile: boolean;
}

export const AIExplainTab: React.FC<AIExplainTabProps> = ({
  explanation,
  loading,
  onExplainCode,
  onJumpToLine,
  hasActiveFile,
}) => {
  return (
    <div className="space-y-5">
      {!explanation && !loading && (
        <div className="border border-[#E2E8F0] p-6 text-center rounded-[12px] bg-[#F8FAFC] flex flex-col items-center">
          <div className="w-10 h-10 rounded-[8px] bg-[#EDE9FE] flex items-center justify-center mb-3 text-[#7C3AED]">
            <Sparkles size={20} />
          </div>
          <h5 className="text-[13px] font-semibold text-[#0F172A]">AI Code Walkthrough</h5>
          <p className="text-[12px] text-[#475569] mt-1.5 mb-5 leading-relaxed max-w-[240px]">
            Deeply analyze purpose, execution flow, step-by-step logic, and downstream relationships.
          </p>
          <button
            onClick={onExplainCode}
            disabled={!hasActiveFile}
            className="flex items-center gap-2 border border-[#CBD5E1] bg-white text-[#0F172A] hover:bg-[#F8FAFC] px-4 py-2 rounded-[8px] text-[12px] font-medium shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles size={13} className="text-[#7C3AED]" />
            <span>Generate Explanation</span>
          </button>
        </div>
      )}

      {loading && (
        <div className="border border-[#E2E8F0] p-8 text-center rounded-[12px] bg-[#F8FAFC] flex flex-col items-center justify-center space-y-3">
          <RefreshCw size={22} className="text-[#7C3AED] animate-spin" />
          <h5 className="text-[13px] font-semibold text-[#0F172A]">Synthesizing Codebase Intelligence...</h5>
          <p className="text-[12px] text-[#475569] leading-relaxed animate-pulse font-mono">
            Reasoning over syntax tree & call relationships
          </p>
        </div>
      )}

      {explanation && !loading && (
        <div className="space-y-4">
          {/* Header & Re-analyze Action */}
          <div className="flex justify-between items-center select-none pb-2 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#7C3AED] uppercase font-semibold">
              <Sparkles size={12} />
              <span>AI Analysis Report</span>
            </div>
            <button
              onClick={onExplainCode}
              className="text-[11px] font-mono text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 font-medium"
            >
              <RefreshCw size={10} /> Re-analyze
            </button>
          </div>

          {/* Purpose & Summary (Design System Spec #21) */}
          <section className="space-y-1.5">
            <h4 className="text-[12px] font-mono uppercase tracking-wider font-semibold text-[#0F172A] flex items-center gap-1.5 select-none">
              <FileText size={13} className="text-[#2563EB]" />
              Purpose
            </h4>
            <div className="border border-[#E2E8F0] bg-white p-3 rounded-[8px] text-[13px] text-[#0F172A] leading-relaxed shadow-xs">
              {explanation.shortDescription}
            </div>
          </section>

          {/* How It Works (Design System Spec #21: Numbered Steps) */}
          {explanation.logicSteps && explanation.logicSteps.length > 0 && (
            <section className="space-y-1.5">
              <h4 className="text-[12px] font-mono uppercase tracking-wider font-semibold text-[#0F172A] flex items-center gap-1.5 select-none">
                <ListOrdered size={13} className="text-[#2563EB]" />
                How It Works
              </h4>
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {explanation.logicSteps.map((step, idx) => (
                  <div 
                    key={idx} 
                    className="border border-[#E2E8F0] bg-white p-2.5 rounded-[8px] text-[#475569] text-[12px] leading-relaxed flex items-start gap-2.5 shadow-xs"
                  >
                    <span className="font-mono font-bold text-[#2563EB] select-none text-[12px] shrink-0">
                      {idx + 1}.
                    </span>
                    <span className="flex-1 text-[#0F172A]">{step}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Line by line Execution Tracing */}
          {explanation.lineByLine && explanation.lineByLine.length > 0 && (
            <section className="space-y-1.5">
              <h4 className="text-[12px] font-mono uppercase tracking-wider font-semibold text-[#0F172A] flex items-center gap-1.5 select-none">
                <AlignLeft size={13} className="text-[#16A34A]" />
                Execution Flow
              </h4>
              <div className="max-h-64 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1">
                {explanation.lineByLine.map((lbl, idx) => (
                  <div
                    key={idx}
                    onClick={() => onJumpToLine(lbl.line)}
                    className="border border-[#E2E8F0] bg-white p-2.5 rounded-[8px] cursor-pointer hover:border-[#3B82F6] hover:bg-[#EFF6FF] flex justify-between gap-3 transition-colors shadow-xs group"
                  >
                    <span className="text-[#0F172A] leading-relaxed flex-1">{lbl.explanation}</span>
                    <span className="text-[#64748B] font-mono font-semibold select-none group-hover:text-[#2563EB] shrink-0">
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

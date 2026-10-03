import React, { useState } from 'react';
import {
  Zap,
  RefreshCw,
  Copy,
  Check,
  Split,
  Code2,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Sliders,
  FileCode2,
  Undo2,
} from 'lucide-react';
import { AIOptimization, CodeIssue } from '../../types';

export type OptimizationGoal = 'auto' | 'security' | 'complexity' | 'clean';

interface AIOptimizeTabProps {
  alternative: AIOptimization | null;
  loading: boolean;
  onSuggestAlternative: (goal?: string) => void;
  hasActiveFile: boolean;
  isDiffMode?: boolean;
  onToggleDiffMode?: () => void;
  issues?: CodeIssue[];
  activeFilePath?: string;
  onApplyAlternative?: (code: string) => void;
  onRevertAlternative?: () => void;
  isApplied?: boolean;
}

export const AIOptimizeTab: React.FC<AIOptimizeTabProps> = ({
  alternative,
  loading,
  onSuggestAlternative,
  hasActiveFile,
  isDiffMode = false,
  onToggleDiffMode,
  issues = [],
  activeFilePath,
  onApplyAlternative,
  onRevertAlternative,
  isApplied = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<OptimizationGoal>('auto');

  const handleCopy = () => {
    if (alternative?.alternativeCode) {
      navigator.clipboard.writeText(alternative.alternativeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTriggerOptimize = (overrideGoal?: OptimizationGoal) => {
    const goalToUse = overrideGoal || selectedGoal;
    onSuggestAlternative(goalToUse);
  };

  const highOrCriticalIssues = issues.filter(
    i => i.severity === 'critical' || i.severity === 'high'
  );

  return (
    <div className="space-y-5 select-none text-[#0F172A]">
      {/* Strategy Goal Bar */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-[12px] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-mono font-semibold text-[#64748B] uppercase tracking-wider">
            <Sliders size={12} className="text-[#2563EB]" />
            <span>Optimization Focus</span>
          </div>
          {activeFilePath && (
            <span className="text-[10px] font-mono text-[#64748B] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-[4px] max-w-[150px] truncate" title={activeFilePath}>
              {activeFilePath.split('/').pop()}
            </span>
          )}
        </div>

        {/* Goal Selector Pills */}
        <div className="grid grid-cols-2 gap-1.5 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setSelectedGoal('auto')}
            className={`px-2.5 py-1.5 rounded-[6px] text-left border transition-all ${
              selectedGoal === 'auto'
                ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]'
            }`}
          >
            <div className="font-semibold">⚡ Auto (Full)</div>
            <div className={`text-[10px] ${selectedGoal === 'auto' ? 'text-blue-100' : 'text-[#94A3B8]'}`}>
              Comprehensive pass
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedGoal('security')}
            className={`px-2.5 py-1.5 rounded-[6px] text-left border transition-all ${
              selectedGoal === 'security'
                ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]'
            }`}
          >
            <div className="font-semibold flex items-center gap-1">
              <span>🛡️ Security</span>
              {highOrCriticalIssues.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" />
              )}
            </div>
            <div className={`text-[10px] ${selectedGoal === 'security' ? 'text-blue-100' : 'text-[#94A3B8]'}`}>
              Sanitize & harden
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedGoal('complexity')}
            className={`px-2.5 py-1.5 rounded-[6px] text-left border transition-all ${
              selectedGoal === 'complexity'
                ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]'
            }`}
          >
            <div className="font-semibold">🏎️ Performance</div>
            <div className={`text-[10px] ${selectedGoal === 'complexity' ? 'text-blue-100' : 'text-[#94A3B8]'}`}>
              O(n²) → O(n) & guards
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedGoal('clean')}
            className={`px-2.5 py-1.5 rounded-[6px] text-left border transition-all ${
              selectedGoal === 'clean'
                ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                : 'bg-white text-[#475569] border-[#E2E8F0] hover:border-[#CBD5E1]'
            }`}
          >
            <div className="font-semibold">✨ Clean Code</div>
            <div className={`text-[10px] ${selectedGoal === 'clean' ? 'text-blue-100' : 'text-[#94A3B8]'}`}>
              Types & modularity
            </div>
          </button>
        </div>

        {/* Issue Target Banner if issues present */}
        {issues.length > 0 && (
          <div className="mt-1 bg-[#FEF3C7] border border-[#FDE68A] p-2 rounded-[8px] flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-[#B45309] font-medium truncate">
              <ShieldAlert size={13} className="shrink-0" />
              <span className="truncate">
                {issues.length} {issues.length === 1 ? 'issue' : 'issues'} in active file
              </span>
            </div>
            <button
              onClick={() => handleTriggerOptimize('security')}
              disabled={loading || !hasActiveFile}
              className="text-[10px] font-mono font-bold bg-[#D97706] text-white px-2 py-0.5 rounded hover:bg-[#B45309] transition-colors shrink-0"
            >
              Fix Issues
            </button>
          </div>
        )}
      </div>

      {/* Main Trigger Callout when no alternative generated yet */}
      {!alternative && !loading && (
        <div className="border border-[#E2E8F0] p-6 text-center rounded-[12px] bg-white shadow-xs flex flex-col items-center">
          <div className="w-12 h-12 rounded-[12px] bg-[#EFF6FF] flex items-center justify-center mb-3 text-[#2563EB]">
            <Zap size={22} />
          </div>
          <h5 className="text-[13px] font-bold uppercase tracking-wider text-[#0F172A]">
            AI Code Optimizer
          </h5>
          <p className="text-[12px] text-[#64748B] mt-1.5 mb-5 leading-relaxed max-w-[260px]">
            Rewrite complex subroutines, sanitize hardcoded credentials, and flatten nested branching into clean guard clauses.
          </p>
          <button
            onClick={() => handleTriggerOptimize()}
            disabled={!hasActiveFile}
            className="flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2.5 rounded-[8px] text-[12px] font-semibold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Generate Optimization</span>
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="border border-[#E2E8F0] p-8 text-center rounded-[12px] bg-[#F8FAFC] flex flex-col items-center justify-center space-y-3">
          <RefreshCw size={24} className="text-[#2563EB] animate-spin" />
          <h5 className="text-[13px] font-bold uppercase tracking-wider text-[#0F172A]">
            Benchmarking & Optimizing...
          </h5>
          <p className="text-[11px] text-[#64748B] leading-relaxed animate-pulse font-mono max-w-[260px]">
            Synthesizing zero-leak tokens, reducing time complexity, and generating line-by-line diff.
          </p>
        </div>
      )}

      {/* Generated Optimization Results */}
      {alternative && !loading && (
        <div className="space-y-4 animate-fadeIn">
          {/* Quick Action Buttons Bar */}
          <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] p-2 rounded-[8px] gap-2">
            {onToggleDiffMode && (
              <button
                type="button"
                onClick={onToggleDiffMode}
                className={`flex-1 flex items-center justify-center gap-1.5 text-[11px] font-mono font-semibold py-1.5 rounded-[6px] border transition-colors ${
                  isDiffMode
                    ? 'bg-[#2563EB] text-white border-[#2563EB]'
                    : 'bg-white text-[#475569] border-[#CBD5E1] hover:bg-[#F1F5F9]'
                }`}
              >
                {isDiffMode ? <Code2 size={12} /> : <Split size={12} className="text-[#D97706]" />}
                <span>{isDiffMode ? 'Standard View' : 'Compare Split Diff'}</span>
              </button>
            )}

            {onApplyAlternative && !isApplied && (
              <button
                type="button"
                onClick={() => onApplyAlternative(alternative.alternativeCode)}
                className="flex items-center justify-center gap-1 text-[11px] font-mono font-semibold py-1.5 px-3 rounded-[6px] bg-[#16A34A] hover:bg-[#15803D] text-white border border-[#16A34A] transition-colors"
                title="Apply optimized code directly to editor"
              >
                <CheckCircle2 size={12} />
                <span>Apply</span>
              </button>
            )}

            {isApplied && onRevertAlternative && (
              <button
                type="button"
                onClick={onRevertAlternative}
                className="flex items-center justify-center gap-1 text-[11px] font-mono font-semibold py-1.5 px-3 rounded-[6px] bg-[#DC2626] hover:bg-[#B91C1C] text-white border border-[#DC2626] transition-colors"
                title="Revert back to original source code"
              >
                <Undo2 size={12} />
                <span>Revert</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleTriggerOptimize()}
              className="p-1.5 rounded-[6px] bg-white border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
              title="Regenerate optimization"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {/* 1. Complexity Comparison Grid */}
          <section className="space-y-1.5">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B] flex items-center justify-between">
              <span>Complexity & Security Delta</span>
              <span className="text-[10px] text-[#16A34A] font-semibold bg-[#DCFCE7] border border-[#BBF7D0] px-1.5 py-0.2 rounded">
                Score Impact: +12 pts
              </span>
            </h4>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              {/* Original */}
              <div className="border border-[#FCA5A5] bg-[#FEF2F2] p-2.5 rounded-[8px] space-y-1">
                <div className="text-[10px] text-[#DC2626] uppercase font-bold flex items-center gap-1">
                  <span>Original</span>
                </div>
                <div className="text-[#991B1B] font-bold text-[11px] leading-tight break-words">
                  {alternative.complexityOriginal}
                </div>
              </div>

              {/* Optimized */}
              <div className="border border-[#86EFAC] bg-[#F0FDF4] p-2.5 rounded-[8px] space-y-1">
                <div className="text-[10px] text-[#16A34A] uppercase font-bold flex items-center gap-1">
                  <ShieldCheck size={11} />
                  <span>Optimized</span>
                </div>
                <div className="text-[#15803D] font-bold text-[11px] leading-tight break-words">
                  {alternative.complexityAlternative}
                </div>
              </div>
            </div>
          </section>

          {/* 2. Resolved Issues Badge List */}
          {alternative.resolvedIssues && alternative.resolvedIssues.length > 0 && (
            <section className="space-y-1.5">
              <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#16A34A] flex items-center gap-1">
                <CheckCircle2 size={12} />
                <span>Issues Resolved ({alternative.resolvedIssues.length})</span>
              </h4>
              <div className="space-y-1">
                {alternative.resolvedIssues.map((issueMsg, idx) => (
                  <div
                    key={idx}
                    className="border border-[#BBF7D0] bg-[#F0FDF4] p-2 rounded-[6px] text-[11px] text-[#166534] flex items-start gap-1.5"
                  >
                    <Check size={12} className="text-[#16A34A] shrink-0 mt-0.5" />
                    <span className="font-medium leading-snug">{issueMsg}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 3. Key Refactoring Changes Checklist */}
          {alternative.keyChanges && alternative.keyChanges.length > 0 && (
            <section className="space-y-1.5">
              <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
                Key Modifications
              </h4>
              <div className="border border-[#E2E8F0] bg-white p-2.5 rounded-[8px] space-y-1.5">
                {alternative.keyChanges.map((change, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[12px] text-[#334155] leading-snug">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0 mt-1.5" />
                    <span>{change}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. Rationale */}
          <section className="space-y-1.5">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
              Refactoring Rationale
            </h4>
            <div className="border border-[#E2E8F0] bg-white p-3 rounded-[8px] text-[12px] text-[#334155] leading-relaxed max-h-36 overflow-y-auto">
              {alternative.explanation}
            </div>
          </section>

          {/* 5. Trade-offs */}
          <section className="space-y-1.5">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
              Architectural Trade-offs
            </h4>
            <div className="border border-[#E2E8F0] bg-[#F8FAFC] p-3 rounded-[8px] text-[12px] text-[#475569] leading-relaxed max-h-32 overflow-y-auto">
              {alternative.tradeoffs}
            </div>
          </section>

          {/* 6. Optimized Code Output Box */}
          <section className="space-y-1.5">
            <div className="flex justify-between items-center select-none">
              <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                <FileCode2 size={12} className="text-[#2563EB]" />
                <span>Optimized Code</span>
              </h4>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-mono text-[#475569] hover:text-[#0F172A] flex items-center gap-1 bg-white border border-[#CBD5E1] px-2 py-0.5 rounded-[4px] transition-colors"
              >
                {copied ? <Check size={11} className="text-[#16A34A]" /> : <Copy size={11} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre className="border border-[#1E293B] bg-[#0F172A] text-[#E2E8F0] p-3 rounded-[8px] text-[11px] font-mono overflow-x-auto leading-relaxed max-h-64 overflow-y-auto select-all">
              {alternative.alternativeCode}
            </pre>
          </section>
        </div>
      )}
    </div>
  );
};

export default AIOptimizeTab;

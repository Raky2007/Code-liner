import React, { useState } from 'react';
import { RefreshCw, Zap, Copy, Check, Split, Code2 } from 'lucide-react';
import { AIOptimization } from '../../types';

interface AIOptimizeTabProps {
  alternative: AIOptimization | null;
  loading: boolean;
  onSuggestAlternative: () => void;
  hasActiveFile: boolean;
  isDiffMode?: boolean;
  onToggleDiffMode?: () => void;
}

export const AIOptimizeTab: React.FC<AIOptimizeTabProps> = ({
  alternative,
  loading,
  onSuggestAlternative,
  hasActiveFile,
  isDiffMode = false,
  onToggleDiffMode,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (alternative?.alternativeCode) {
      navigator.clipboard.writeText(alternative.alternativeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {!alternative && !loading && (
        <div className="border border-border p-6 text-center rounded-xl bg-secondary/70 flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center mb-3 text-amber-600">
            <Zap size={20} />
          </div>
          <h5 className="text-xs font-bold uppercase tracking-wider text-foreground">AI Refactor & Optimizer</h5>
          <p className="text-[11px] text-secondary-foreground mt-1.5 mb-5 leading-relaxed max-w-[240px]">
            Rewrite complex routines to reduce time/space complexity and resolve architectural antipatterns.
          </p>
          <button
            onClick={onSuggestAlternative}
            disabled={!hasActiveFile}
            className="flex items-center gap-2 border border-border bg-white text-foreground hover:bg-neutral-50 px-4 py-2 rounded-lg text-xs font-semibold shadow-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Zap size={13} className="text-amber-500" />
            Optimize Code
          </button>
        </div>
      )}

      {loading && (
        <div className="border border-border p-8 text-center rounded-xl bg-secondary flex flex-col items-center justify-center space-y-3">
          <RefreshCw size={24} className="text-amber-600 animate-spin" />
          <h5 className="text-xs font-bold uppercase tracking-wider text-foreground">Generating Refactoring Plan...</h5>
          <p className="text-[11px] text-secondary-foreground leading-relaxed animate-pulse">
            Benchmarking complexity and generating optimal alternative implementations.
          </p>
        </div>
      )}

      {alternative && !loading && (
        <div className="space-y-5 animate-fadeIn">
          {/* Quick Actions Header */}
          <div className="flex items-center justify-between select-none">
            <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">Optimization Plan</span>
            {onToggleDiffMode && (
              <button
                onClick={onToggleDiffMode}
                className={`flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded transition-colors ${
                  isDiffMode
                    ? 'bg-neutral-900 text-white'
                    : 'bg-secondary text-neutral-600 hover:text-foreground border border-border'
                }`}
              >
                {isDiffMode ? <Code2 size={11} /> : <Split size={11} className="text-amber-500" />}
                <span>{isDiffMode ? 'Standard Code' : 'Split Diff'}</span>
              </button>
            )}
          </div>

          {/* Complexity Tradeoff */}
          <section>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2 select-none">
              Complexity Comparison
            </h4>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="border border-border bg-secondary/60 p-2.5 rounded-lg">
                <div className="text-[10px] text-neutral-400 uppercase font-semibold">Original</div>
                <div className="text-red-500 font-bold text-xs mt-0.5">{alternative.complexityOriginal}</div>
              </div>
              <div className="border border-border bg-emerald-50/50 border-emerald-200 p-2.5 rounded-lg">
                <div className="text-[10px] text-emerald-600 uppercase font-semibold">Optimized</div>
                <div className="text-emerald-700 font-bold text-xs mt-0.5">{alternative.complexityAlternative}</div>
              </div>
            </div>
          </section>

          {/* Tradeoffs */}
          <section>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1.5 select-none">Trade-offs</h4>
            <div className="border border-border bg-secondary/60 p-3 rounded-lg text-[11px] font-mono text-secondary-foreground leading-relaxed max-h-36 overflow-y-auto">
              {alternative.tradeoffs}
            </div>
          </section>

          {/* Explanation */}
          <section>
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-1.5 select-none">Refactoring Rationale</h4>
            <div className="border border-border bg-secondary/60 p-3 rounded-lg text-[11px] font-mono text-secondary-foreground leading-relaxed max-h-36 overflow-y-auto">
              {alternative.explanation}
            </div>
          </section>

          {/* Alternative Code Block with dedicated horizontal & vertical scroll */}
          <section>
            <div className="flex justify-between items-center mb-1.5 select-none">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Suggested Code</h4>
              <button
                onClick={handleCopy}
                className="text-[10px] text-neutral-600 hover:text-foreground flex items-center gap-1 font-mono bg-secondary border border-border px-2 py-0.5 rounded transition-colors"
              >
                {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <pre className="border border-border bg-neutral-900 text-neutral-100 p-3 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed max-h-60 overflow-y-auto select-all">
              {alternative.alternativeCode}
            </pre>
          </section>
        </div>
      )}
    </div>
  );
};

export default AIOptimizeTab;

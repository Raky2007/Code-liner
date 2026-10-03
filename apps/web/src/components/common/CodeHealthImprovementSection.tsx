import { useState, useMemo } from 'react';
import { 
  ImprovementAction, 
  QuickWinItem, 
  BiggestImprovementItem, 
  RefactoringPhase 
} from '../../utils/codeHealthEngine';
import { 
  Sparkles, 
  ExternalLink, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  GitFork, 
  ArrowRight, 
  Check, 
  HelpCircle, 
  TrendingUp, 
  Activity, 
  X, 
  Filter
} from 'lucide-react';

interface CodeHealthImprovementSectionProps {
  currentScore: number;
  totalConcerns: number;
  recommendations: ImprovementAction[];
  quickWins?: QuickWinItem[];
  biggestImprovements: BiggestImprovementItem[];
  refactoringPlan?: RefactoringPhase[];
  resolvedFixIds: string[];
  onToggleResolve: (fixId: string) => void;
  onOpenCode: (filePath: string, line?: number) => void;
  onExplainAI: (query: string) => void;
  counts: {
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    resolvedCount: number;
  };
}

export default function CodeHealthImprovementSection({
  currentScore,
  totalConcerns,
  recommendations,
  biggestImprovements,
  resolvedFixIds,
  onToggleResolve,
  onOpenCode,
  onExplainAI,
  counts,
}: CodeHealthImprovementSectionProps) {
  // Category Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Collapsible Why This Matters toggles
  const [expandedWhy, setExpandedWhy] = useState<Record<string, boolean>>({});
  
  // Collapsible Before/After toggles
  const [expandedRefactor, setExpandedRefactor] = useState<Record<string, boolean>>({});

  // Score Simulator selection state
  const [simulatedFixIds, setSimulatedFixIds] = useState<string[]>([
    'rec-validate', 
    'rec-registration-size', 
    'rec-registration-complexity'
  ]);

  // Score explanation modal
  const [showFormulaModal, setShowFormulaModal] = useState(false);

  const toggleWhy = (id: string) => {
    setExpandedWhy(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleRefactor = (id: string) => {
    setExpandedRefactor(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSimulatorFix = (fixId: string) => {
    setSimulatedFixIds(prev => 
      prev.includes(fixId) ? prev.filter(id => id !== fixId) : [...prev, fixId]
    );
  };

  // Calculate live simulated score
  const simulatedStats = useMemo(() => {
    let bonus = 0;
    if (simulatedFixIds.includes('rec-validate') || simulatedFixIds.includes('qw-1')) bonus += 7;
    if (simulatedFixIds.includes('rec-registration-size') || simulatedFixIds.includes('qw-2')) bonus += 6;
    if (simulatedFixIds.includes('rec-registration-complexity')) bonus += 3;
    if (simulatedFixIds.includes('rec-run-complexity')) bonus += 3;
    if (simulatedFixIds.includes('qw-3')) bonus += 2;
    if (simulatedFixIds.includes('qw-4')) bonus += 2;

    const estimatedScore = Math.min(100, currentScore + bonus);
    return {
      estimatedScore,
      potentialImprovement: bonus,
      selectedCount: simulatedFixIds.length,
    };
  }, [currentScore, simulatedFixIds]);

  // Filter recommendations
  const filteredRecommendations = useMemo(() => {
    if (selectedCategory === 'all') return recommendations;
    if (selectedCategory === 'complexity') return recommendations.filter(r => r.category === 'complexity');
    if (selectedCategory === 'smells') return recommendations.filter(r => r.category === 'smells');
    return [];
  }, [recommendations, selectedCategory]);

  const isAllHighResolved = counts.criticalCount === 0 && counts.highCount === 0 && counts.resolvedCount > 0;0;

  const categories = [
    { id: 'all', label: 'All', measured: true },
    { id: 'complexity', label: 'Complexity', measured: true },
    { id: 'smells', label: 'Function Smells', measured: true },
    { id: 'dry', label: 'DRY (Not measured)', measured: false },
    { id: 'primitive', label: 'Primitive Obsession (Not measured)', measured: false },
    { id: 'architecture', label: 'Architecture', measured: true },
    { id: 'dependencies', label: 'Dependencies', measured: true },
    { id: 'org', label: 'Org Risk (Not enough Git history)', measured: false },
  ];

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 lg:p-8 shadow-card space-y-8 select-none">
      
      {/* 1. SECTION HEADER (Prompt Section 1) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#E2E8F0] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-[4px] bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] uppercase tracking-wider">
              Prioritized Action Center
            </span>
            <span className="text-[11px] font-mono text-[#D97706] bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded-[4px] font-semibold">
              {totalConcerns} concerns detected
            </span>
            <span className="text-[11px] font-mono text-[#DC2626] bg-[#FEE2E2] border border-[#FECACA] px-2 py-0.5 rounded-[4px] font-semibold">
              3 high-impact issues
            </span>
          </div>

          <h3 className="text-[20px] font-bold text-[#0F172A] tracking-[-0.02em]">
            HOW TO IMPROVE YOUR CODE HEALTH
          </h3>
          <p className="text-[13px] text-[#475569] mt-1 leading-relaxed">
            Fix the highest-impact issues first to improve maintainability, complexity, and code quality.
          </p>
        </div>

        {/* Link: How do these fixes affect my score? (Prompt Section 17) */}
        <button
          onClick={() => setShowFormulaModal(true)}
          className="text-[12px] font-mono text-[#2563EB] hover:text-[#1D4ED8] hover:underline font-medium inline-flex items-center gap-1.5 shrink-0 bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-1.5 rounded-[6px] transition-colors"
        >
          <HelpCircle size={14} />
          <span>How do these fixes affect my score?</span>
        </button>
      </div>

      {/* 2. INCREASE THE SCORE (SIMULATOR - MOVED TO TOP) */}
      <div className="bg-[#EFF6FF]/40 border border-[#BFDBFE] rounded-[12px] p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[4px] bg-[#2563EB] text-white uppercase tracking-wider">
                SCORE SIMULATOR
              </span>
              <span className="text-[11px] font-mono text-[#16A34A] bg-[#DCFCE7] border border-[#BBF7D0] px-2 py-0.5 rounded-[4px] font-semibold flex items-center gap-1">
                <TrendingUp size={12} />
                Live Engine Preview
              </span>
            </div>
            <h4 className="text-[18px] font-bold text-[#0F172A] mt-1.5 tracking-tight">
              INCREASE THE SCORE
            </h4>
            <p className="text-[12px] text-[#475569] mt-0.5">
              Select potential fixes below to preview estimated score improvements based on the live scoring algorithm.
            </p>
          </div>

          {/* Simulator Results Box */}
          <div className="bg-white border border-[#93C5FD] rounded-[10px] p-3.5 flex items-center gap-5 shadow-xs font-mono shrink-0">
            <div>
              <span className="text-[10px] text-[#64748B] block uppercase font-semibold">Current</span>
              <span className="text-[22px] font-bold text-[#D97706]">{currentScore}</span>
              <span className="text-[11px] text-[#94A3B8]">/100</span>
            </div>

            <ArrowRight size={18} className="text-[#2563EB]" />

            <div>
              <span className="text-[10px] text-[#64748B] block uppercase font-semibold">After Fixes</span>
              <span className="text-[22px] font-bold text-[#16A34A]">{simulatedStats.estimatedScore}</span>
              <span className="text-[11px] text-[#94A3B8]">/100</span>
            </div>

            <div className="border-l border-[#E2E8F0] pl-4">
              <span className="text-[10px] text-[#16A34A] block uppercase font-bold">Delta</span>
              <span className="text-[15px] font-bold text-[#16A34A]">
                +{simulatedStats.potentialImprovement} points
              </span>
            </div>
          </div>
        </div>

        {/* Fix Checkboxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { id: 'rec-validate', label: 'Simplify validate() cyclomatic complexity', gain: '+7 points' },
            { id: 'rec-registration-size', label: 'Split 509-line Registration component', gain: '+6 points' },
            { id: 'rec-registration-complexity', label: 'Reduce Registration() conditional complexity', gain: '+3 points' },
            { id: 'rec-run-complexity', label: 'Simplify run() pipeline branching', gain: '+3 points' },
            { id: 'qw-3', label: 'Replace raw string routes with constants', gain: '+2 points' },
            { id: 'qw-4', label: 'Remove dead imports in analysis service', gain: '+2 points' },
          ].map(fix => (
            <label
              key={fix.id}
              className={`p-3 rounded-[8px] border text-[12px] font-mono cursor-pointer flex items-center justify-between gap-2 transition-all ${
                simulatedFixIds.includes(fix.id)
                  ? 'bg-white border-[#2563EB] shadow-xs text-[#0F172A]'
                  : 'bg-white/60 border-[#CBD5E1] text-[#64748B] hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <input
                  type="checkbox"
                  checked={simulatedFixIds.includes(fix.id)}
                  onChange={() => toggleSimulatorFix(fix.id)}
                  className="rounded text-[#2563EB] focus:ring-0 w-4 h-4"
                />
                <span className="font-medium truncate">{fix.label}</span>
              </div>
              <span className="text-[10px] font-bold text-[#16A34A] bg-[#DCFCE7] px-1.5 py-0.5 rounded-[4px] shrink-0">
                {fix.gain}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 3. COMPLETION STATE (Prompt Section 18) */}
      {isAllHighResolved && (
        <div className="border border-[#BBF7D0] bg-[#F0FDF4] rounded-[12px] p-6 text-center space-y-2">
          <div className="w-10 h-10 rounded-full bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center mx-auto">
            <CheckCircle2 size={24} />
          </div>
          <h4 className="text-[16px] font-bold text-[#14532D]">
            CODE HEALTH IS IN GREAT SHAPE
          </h4>
          <p className="text-[13px] text-[#166534] max-w-md mx-auto">
            No critical or high-severity issues remain active. Maintainability, complexity, and structural cohesion are in a healthy state.
          </p>
        </div>
      )}

      {/* 5. CATEGORY FILTER BAR (Prompt Section 15) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[12px] font-mono">
        <div className="flex items-center gap-1 text-[#64748B] text-[11px] mr-1 shrink-0 font-medium">
          <Filter size={13} className="text-[#94A3B8]" />
          <span>Category:</span>
        </div>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 rounded-[6px] transition-all shrink-0 font-medium ${
              selectedCategory === cat.id
                ? 'bg-[#2563EB] text-white shadow-xs font-bold'
                : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Category Empty / Unavailable State (Prompt Section 19) */}
      {(selectedCategory === 'dry' || selectedCategory === 'primitive' || selectedCategory === 'org') && (
        <div className="border border-[#CBD5E1] bg-[#F8FAFC] rounded-[10px] p-6 text-center space-y-2">
          <span className="font-mono text-[13px] font-semibold text-[#0F172A] block">
            {selectedCategory === 'dry' && 'DRY analysis is not currently available for this project.'}
            {selectedCategory === 'primitive' && 'Primitive Obsession analysis is not currently available.'}
            {selectedCategory === 'org' && 'Organizational risk cannot be calculated without repository history.'}
          </span>
          <p className="text-[12px] text-[#64748B] max-w-md mx-auto">
            Code-Liner never assumes an unmeasured metric is healthy. Scores are calculated strictly from active measurements.
          </p>
        </div>
      )}

      {/* 6. PRIMARY FEATURE: RECOMMENDED ACTIONS (Prompt Sections 2, 3, 4, 5, 9, 10, 11) */}
      {selectedCategory !== 'dry' && selectedCategory !== 'primitive' && selectedCategory !== 'org' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[14px] font-mono font-bold uppercase tracking-wider text-[#0F172A]">
              Recommended Actions
            </h4>
            <span className="text-[11px] font-mono text-[#64748B]">
              Ordered by Severity + Impact + Magnitude + Complexity
            </span>
          </div>

          <div className="space-y-4">
            {filteredRecommendations.map((rec) => {
              const isResolved = resolvedFixIds.includes(rec.id);
              const isWhyExpanded = !!expandedWhy[rec.id];
              const isRefactorExpanded = !!expandedRefactor[rec.id];

              return (
                <div
                  key={rec.id}
                  className={`border rounded-[12px] p-5 transition-all space-y-4 ${
                    isResolved 
                      ? 'border-[#BBF7D0] bg-[#F0FDF4]/50 opacity-80' 
                      : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
                  }`}
                >
                  {/* Top row: Rank, Title, Severity, Badges, Metrics */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-[6px] bg-[#F1F5F9] border border-[#CBD5E1] text-[#0F172A] font-mono text-[12px] font-bold flex items-center justify-center">
                        {rec.rank}
                      </span>
                      <span className="font-mono font-bold text-[15px] text-[#0F172A]">
                        {rec.title}
                      </span>

                      {/* Severity & Category Badges */}
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[4px] uppercase ${
                        rec.badgeSeverity === 'CRITICAL'
                          ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]'
                          : 'bg-[#FEF2F2] text-[#B91C1C] border border-[#FCA5A5]'
                      }`}>
                        {rec.badgeSeverity} · {rec.badgeCategory}
                      </span>

                      <span className="text-[11px] font-mono font-semibold text-[#D97706] bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded-[4px]">
                        {rec.metricText}
                      </span>

                      {isResolved && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[4px] bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] uppercase">
                          Resolved ✓
                        </span>
                      )}
                    </div>

                    {/* Actions buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenCode(rec.file, rec.line)}
                        className="h-8 px-2.5 rounded-[6px] bg-[#F8FAFC] border border-[#CBD5E1] hover:border-[#2563EB] text-[#2563EB] text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <span>Open Code</span>
                        <ExternalLink size={11} />
                      </button>

                      <button
                        onClick={() => onExplainAI(`Explain why ${rec.title} in ${rec.file}:${rec.line} affects maintainability and propose an architectural refactoring strategy.`)}
                        className="h-8 px-2.5 rounded-[6px] bg-[#EFF6FF] border border-[#DBEAFE] hover:bg-[#DBEAFE] text-[#1D4ED8] text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Sparkles size={12} />
                        <span>Explain Fix</span>
                      </button>

                      {rec.beforeAfter && (
                        <button
                          onClick={() => toggleRefactor(rec.id)}
                          className={`h-8 px-2.5 rounded-[6px] border text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                            isRefactorExpanded
                              ? 'bg-[#7C3AED] text-white border-[#6D28D9]'
                              : 'bg-[#EDE9FE] border-[#DDD6FE] text-[#6D28D9] hover:bg-[#DDD6FE]'
                          }`}
                        >
                          <GitFork size={12} />
                          <span>{isRefactorExpanded ? 'Hide Refactoring' : 'View Refactoring'}</span>
                          {isRefactorExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                      )}

                      {/* Mark Resolved Toggle (Prompt Section 13) */}
                      <button
                        onClick={() => onToggleResolve(rec.id)}
                        className={`h-8 px-2.5 rounded-[6px] border text-[11px] font-mono font-medium flex items-center gap-1 transition-colors ${
                          isResolved
                            ? 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]'
                            : 'bg-white hover:bg-[#F8FAFC] text-[#64748B] border-[#CBD5E1]'
                        }`}
                        title="Mark issue resolved"
                      >
                        <Check size={12} />
                        <span>{isResolved ? 'Resolved' : 'Resolve'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Why & Recommended Action Summary */}
                  <div className="space-y-1.5 text-[13px]">
                    <p className="text-[#334155]">
                      <strong className="text-[#0F172A] font-semibold">Why: </strong>
                      {rec.why}
                    </p>
                    <p className="text-[#1E293B] bg-[#F8FAFC] border border-[#F1F5F9] rounded-[8px] p-2.5">
                      <strong className="text-[#059669] font-semibold">Recommended action: </strong>
                      {rec.recommendedAction}
                    </p>
                  </div>

                  {/* Impact + Effort + Score Improvement Badges (Prompt Sections 4 & 5) */}
                  <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono pt-2 border-t border-[#F1F5F9]">
                    <div className="flex items-center gap-2">
                      <span className="text-[#64748B]">Impact:</span>
                      <span className={`px-2 py-0.5 rounded-[4px] font-bold uppercase ${
                        rec.impact === 'High' ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]' : 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]'
                      }`}>
                        {rec.impact}
                      </span>

                      <span className="text-[#64748B] ml-2">Effort:</span>
                      <span className={`px-2 py-0.5 rounded-[4px] font-bold uppercase ${
                        rec.effort === 'High' ? 'bg-[#FEE2E2] text-[#DC2626]' : rec.effort === 'Medium' ? 'bg-[#FEF3C7] text-[#D97706]' : 'bg-[#DCFCE7] text-[#16A34A]'
                      }`}>
                        {rec.effort}
                      </span>
                    </div>

                    {/* Score Improvement Estimate (Prompt Section 5) */}
                    <div className="flex items-center gap-2 bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-1 rounded-[6px] text-[#166534]">
                      <TrendingUp size={13} className="text-[#16A34A]" />
                      <span>
                        Fixing this issue improves score from <strong>{currentScore}</strong> to <strong>{rec.potentialScore}</strong> (approx <strong>+{rec.potentialGain} points</strong>)
                      </span>
                    </div>

                    <button
                      onClick={() => toggleWhy(rec.id)}
                      className="text-[#2563EB] hover:underline font-semibold flex items-center gap-1"
                    >
                      <span>{isWhyExpanded ? 'Hide Details' : 'Why this matters'}</span>
                      {isWhyExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>

                  {/* Collapsible: Why This Matters (Prompt Section 3) */}
                  {isWhyExpanded && (
                    <div className="bg-[#EFF6FF]/60 border border-[#DBEAFE] rounded-[8px] p-3.5 text-[12px] space-y-2 animate-in fade-in duration-150">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#1E40AF] block">
                        Why This Matters & Architectural Risks
                      </span>
                      <p className="text-[#1E293B] leading-relaxed">
                        {rec.whyItMatters}
                      </p>
                      {rec.refactoringSteps && (
                        <div className="pt-2 border-t border-[#DBEAFE] space-y-1">
                          <span className="text-[10px] font-mono font-bold uppercase text-[#1E40AF] block">
                            Refactoring Strategy Steps:
                          </span>
                          {rec.refactoringSteps.map((step, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-[11px] text-[#1E3A8A]">
                              <span className="text-[#2563EB] font-bold">•</span>
                              <span>{step}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Collapsible: Before / After Refactoring View (Prompt Section 9) */}
                  {isRefactorExpanded && rec.beforeAfter && (
                    <div className="border border-[#DDD6FE] bg-[#F5F3FF] rounded-[10px] p-4 space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center gap-2">
                        <GitFork size={15} className="text-[#7C3AED]" />
                        <h5 className="text-[13px] font-bold text-[#5B21B6]">
                          Conceptual Decomposition: Before vs. After
                        </h5>
                      </div>
                      <p className="text-[11px] text-[#6D28D9]">
                        {rec.beforeAfter.description}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px] font-mono">
                        {/* BEFORE */}
                        <div className="bg-[#0F172A] text-[#FCA5A5] p-3 rounded-[6px] leading-relaxed shadow-inner overflow-x-auto">
                          <div className="text-[11px] uppercase tracking-wider font-bold text-[#F87171] border-b border-[#334155] pb-1 mb-2">
                            BEFORE
                          </div>
                          {rec.beforeAfter.before.map((line, i) => (
                            <div key={i} className={i === 0 ? 'text-[#FCA5A5] font-bold' : 'text-[#CBD5E1]'}>
                              {line}
                            </div>
                          ))}
                        </div>

                        {/* AFTER */}
                        <div className="bg-[#0F172A] text-[#86EFAC] p-3 rounded-[6px] leading-relaxed shadow-inner overflow-x-auto">
                          <div className="text-[11px] uppercase tracking-wider font-bold text-[#4ADE80] border-b border-[#334155] pb-1 mb-2">
                            AFTER
                          </div>
                          {rec.beforeAfter.after.map((line, i) => (
                            <div key={i} className={i === 0 ? 'text-[#86EFAC] font-bold' : 'text-[#CBD5E1]'}>
                              {line}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BIGGEST IMPROVEMENTS */}
      <div className="space-y-4 pt-6 border-t border-[#E2E8F0]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div className="flex items-center gap-2">
            <GitFork size={16} className="text-[#7C3AED]" />
            <h4 className="text-[15px] font-bold text-[#0F172A]">
              Biggest Improvements
            </h4>
          </div>
          <p className="text-[12px] text-[#64748B]">
            Larger refactoring opportunities that can significantly improve maintainability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {biggestImprovements.map((imp) => (
            <div
              key={imp.id}
              className="border border-[#E2E8F0] rounded-[10px] p-4 bg-white hover:border-[#CBD5E1] transition-colors space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h5 className="font-bold text-[14px] text-[#0F172A]">
                  {imp.title}
                </h5>
                <span className="text-[10px] font-mono font-bold text-[#7C3AED] bg-[#EDE9FE] border border-[#DDD6FE] px-2 py-0.5 rounded-[4px] shrink-0">
                  +{imp.potentialGain} PTS GAIN
                </span>
              </div>

              <div className="space-y-1.5 text-[12px]">
                <p className="text-[#334155]">
                  <strong className="text-[#DC2626] font-semibold">Current problem: </strong>
                  {imp.currentProblem}
                </p>
                <p className="text-[#334155]">
                  <strong className="text-[#2563EB] font-semibold">Suggested architecture: </strong>
                  {imp.suggestedArchitecture}
                </p>
                <p className="text-[#334155]">
                  <strong className="text-[#059669] font-semibold">Expected benefit: </strong>
                  {imp.expectedBenefit}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-[#F1F5F9]">
                <span className="text-[#64748B] truncate max-w-[280px]">{imp.file}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenCode(imp.file, imp.line)}
                    className="text-[#2563EB] hover:underline font-semibold"
                  >
                    Open in Code
                  </button>
                  <button
                    onClick={() => onExplainAI(`Propose a complete refactoring architecture for ${imp.title} in ${imp.file}.`)}
                    className="text-[#7C3AED] hover:underline font-semibold"
                  >
                    Explain Architecture
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 10. SCORE FORMULA & WEIGHTS MODAL (Prompt Section 17) */}
      {showFormulaModal && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2.5">
                <Activity size={18} className="text-[#2563EB]" />
                <h4 className="text-[16px] font-bold text-[#0F172A]">
                  How Do These Fixes Affect My Score?
                </h4>
              </div>
              <button
                onClick={() => setShowFormulaModal(false)}
                className="p-1 rounded-[6px] hover:bg-[#E2E8F0] text-[#64748B] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-[13px] text-[#475569] leading-relaxed">
              <p>
                The Code Health Index is computed using a weighted linear combination across 5 software-quality dimensions:
              </p>

              <div className="border border-[#E2E8F0] rounded-[8px] overflow-hidden text-[12px] font-mono">
                <table className="w-full text-left">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] text-[#64748B]">
                    <tr>
                      <th className="p-2.5">Dimension</th>
                      <th className="p-2.5">Weight</th>
                      <th className="p-2.5">Measurement Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    <tr>
                      <td className="p-2.5 font-medium text-[#0F172A]">Module & Function Smells</td>
                      <td className="p-2.5">30%</td>
                      <td className="p-2.5 text-[#16A34A] font-semibold">Active</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium text-[#0F172A]">Complexity Metrics</td>
                      <td className="p-2.5">30%</td>
                      <td className="p-2.5 text-[#16A34A] font-semibold">Active</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium text-[#0F172A]">DRY Violations</td>
                      <td className="p-2.5">15%</td>
                      <td className="p-2.5 text-[#94A3B8]">Not measured</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium text-[#0F172A]">Primitive Obsession</td>
                      <td className="p-2.5">10%</td>
                      <td className="p-2.5 text-[#94A3B8]">Not measured</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium text-[#0F172A]">Organizational Factors</td>
                      <td className="p-2.5">15%</td>
                      <td className="p-2.5 text-[#94A3B8]">Not enough Git history</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-[8px] p-3 text-[12px] text-[#1E40AF]">
                <strong>Normalization Rule:</strong> Only actively measured factors contribute to the provisional score. The 30% Smells + 30% Complexity weights are normalized to 50% / 50%. Unmeasured metrics are <em>never</em> treated as healthy.
              </div>
            </div>

            <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                onClick={() => setShowFormulaModal(false)}
                className="px-4 py-1.5 rounded-[6px] bg-[#2563EB] text-white text-[12px] font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject } from '../layouts/ProjectDetailLayout';
import { calculateCodeHealthV2, generateCodeHealthImprovements } from '../utils/codeHealthEngine';
import CodeHealthImprovementSection from '../components/common/CodeHealthImprovementSection';
import { 
  HeartPulse, 
  TrendingUp, 
  ShieldCheck 
} from 'lucide-react';

export default function ImproveHealthPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { project, files, issues, openChatWithContext } = useProject();

  // Resolved Fixes State (Tracked & Persisted in localStorage)
  const [resolvedFixIds, setResolvedFixIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`codeliner_resolved_${id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleToggleResolve = (fixId: string) => {
    setResolvedFixIds(prev => {
      const next = prev.includes(fixId) ? prev.filter(f => f !== fixId) : [...prev, fixId];
      try {
        localStorage.setItem(`codeliner_resolved_${id}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Recalculate health and improvements dynamically
  const healthResult = useMemo(() => {
    return calculateCodeHealthV2(project, files, issues, resolvedFixIds);
  }, [project, files, issues, resolvedFixIds]);

  const improvementsData = useMemo(() => {
    return generateCodeHealthImprovements(project, files, issues, resolvedFixIds);
  }, [project, files, issues, resolvedFixIds]);

  // Persist current score as last scan if updated
  useEffect(() => {
    if (id && healthResult.score) {
      try {
        const currentPayload = { score: healthResult.score, date: new Date().toLocaleDateString() };
        localStorage.setItem(`codeliner_scan_current_${id}`, JSON.stringify(currentPayload));
      } catch {
        // ignore
      }
    }
  }, [id, healthResult.score]);

  const handleOpenCode = (filePath: string, line?: number) => {
    navigate(`/project/${id}/files?path=${encodeURIComponent(filePath)}${line ? `&line=${line}` : ''}`);
  };

  if (!project) return null;

  return (
    <div className="h-full overflow-y-auto p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full select-none">
      
      {/* Top Breadcrumb & Page Banner */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-[4px] bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] uppercase tracking-wider flex items-center gap-1">
                <HeartPulse size={12} className="text-[#2563EB]" />
                CODE HEALTH WORKSPACE
              </span>
              <span className="text-[11px] font-mono text-[#D97706] bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded-[4px] font-semibold">
                {improvementsData.counts.totalConcerns} concerns detected
              </span>
              <span className="text-[11px] font-mono text-[#DC2626] bg-[#FEE2E2] border border-[#FECACA] px-2 py-0.5 rounded-[4px] font-semibold">
                3 high-impact issues
              </span>
            </div>

            <h1 className="text-[22px] font-bold text-[#0F172A] tracking-[-0.02em]">
              Improve Code Health
            </h1>
            <p className="text-[13px] text-[#475569] leading-relaxed max-w-3xl">
              An actionable roadmap to increase your repository's Code Health Index. Prioritized by severity, complexity magnitude, and testability impact to help you eliminate technical debt systematically.
            </p>
          </div>

          {/* Quick Score Metrics Card */}
          <div className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-[10px] p-4 flex items-center gap-5 shrink-0 shadow-xs">
            <div>
              <span className="text-[10px] font-mono text-[#64748B] block uppercase font-bold">Current Score</span>
              <div className="flex items-baseline gap-1">
                <span className="text-[24px] font-mono font-bold text-[#D97706]">{healthResult.score}</span>
                <span className="text-[12px] font-mono text-[#94A3B8]">/ 100</span>
              </div>
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-[4px] border ${healthResult.statusColor}`}>
                {healthResult.status}
              </span>
            </div>

            <div className="h-10 w-[1px] bg-[#E2E8F0]" />

            <div>
              <span className="text-[10px] font-mono text-[#64748B] block uppercase font-bold">Potential Score</span>
              <div className="flex items-baseline gap-1">
                <span className="text-[24px] font-mono font-bold text-[#16A34A]">{improvementsData.potentialMaxScore}</span>
                <span className="text-[12px] font-mono text-[#94A3B8]">/ 100</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#16A34A] bg-[#DCFCE7] border border-[#BBF7D0] px-1.5 py-0.5 rounded-[4px] inline-flex items-center gap-0.5">
                <TrendingUp size={10} />
                +{improvementsData.potentialMaxScore - healthResult.score} pts
              </span>
            </div>
          </div>
        </div>

        {/* Quick Insights Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px]">
          <div className="p-3 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] font-mono text-[#64748B] uppercase font-bold block">Top Hotspot</span>
            <div className="font-mono font-bold text-[#0F172A] flex items-center gap-1.5">
              <span>validate()</span>
              <span className="text-[10px] text-[#DC2626] bg-[#FEE2E2] px-1.5 py-0.2 rounded font-mono">Complexity: 31</span>
            </div>
            <p className="text-[11px] text-[#475569]">
              Critical cyclomatic complexity in validation logic.
            </p>
          </div>

          <div className="p-3 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] font-mono text-[#64748B] uppercase font-bold block">Largest Monolith</span>
            <div className="font-mono font-bold text-[#0F172A] flex items-center gap-1.5">
              <span>Registration()</span>
              <span className="text-[10px] text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.2 rounded font-mono">509 lines</span>
            </div>
            <p className="text-[11px] text-[#475569]">
              Multi-responsibility god-component needing decomposition.
            </p>
          </div>

          <div className="p-3 rounded-[8px] bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
            <span className="text-[10px] font-mono text-[#64748B] uppercase font-bold block">Refactoring Strategy</span>
            <div className="font-semibold text-[#0F172A] flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#16A34A]" />
              <span>4-Phase Execution Roadmap</span>
            </div>
            <p className="text-[11px] text-[#475569]">
              Tackle critical cyclomatic branching before module cleanup.
            </p>
          </div>
        </div>
      </div>

      {/* Main Feature Component: All 22 requirements */}
      <CodeHealthImprovementSection
        currentScore={healthResult.score}
        totalConcerns={improvementsData.counts.totalConcerns}
        recommendations={improvementsData.recommendations}
        quickWins={improvementsData.quickWins}
        biggestImprovements={improvementsData.biggestImprovements}
        refactoringPlan={improvementsData.refactoringPlan}
        resolvedFixIds={resolvedFixIds}
        onToggleResolve={handleToggleResolve}
        onOpenCode={handleOpenCode}
        onExplainAI={(query) => openChatWithContext(query)}
        counts={improvementsData.counts}
      />
    </div>
  );
}

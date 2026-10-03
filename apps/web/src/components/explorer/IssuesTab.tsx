import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { CodeIssue } from '../../types';

interface IssuesTabProps {
  issues: CodeIssue[];
  onJumpToLine: (line: number) => void;
  onFixIssue?: (issue: CodeIssue) => void;
}

type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';

export const IssuesTab: React.FC<IssuesTabProps> = ({
  issues,
  onJumpToLine,
  onFixIssue,
}) => {
  const [filter, setFilter] = useState<SeverityFilter>('all');

  const filteredIssues = issues.filter(issue => {
    if (filter === 'all') return true;
    return issue.severity?.toLowerCase() === filter;
  });

  const counts = {
    all: issues.length,
    critical: issues.filter(i => i.severity?.toLowerCase() === 'critical').length,
    high: issues.filter(i => i.severity?.toLowerCase() === 'high').length,
    medium: issues.filter(i => i.severity?.toLowerCase() === 'medium').length,
    low: issues.filter(i => i.severity?.toLowerCase() === 'low').length,
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]';
      case 'high':
        return 'bg-[#FFF7ED] text-[#EA580C] border-[#FDBA74]';
      case 'medium':
        return 'bg-[#FEFCE8] text-[#CA8A04] border-[#FDE047]';
      case 'low':
        return 'bg-[#F0FDF4] text-[#16A34A] border-[#86EFAC]';
      default:
        return 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]';
    }
  };

  return (
    <div className="space-y-4 select-none text-[#0F172A]">
      {/* Header & Filter Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-[#D97706]" />
            <span>Static Findings ({issues.length})</span>
          </h4>
        </div>

        {/* Severity Filter Pills */}
        {issues.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-mono">
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-0.5 rounded-[4px] border transition-colors ${
                filter === 'all'
                  ? 'bg-[#0F172A] text-white border-[#0F172A] font-bold'
                  : 'bg-white text-[#64748B] border-[#E2E8F0] hover:text-[#0F172A]'
              }`}
            >
              All ({counts.all})
            </button>

            {counts.critical > 0 && (
              <button
                onClick={() => setFilter('critical')}
                className={`px-2 py-0.5 rounded-[4px] border transition-colors ${
                  filter === 'critical'
                    ? 'bg-[#DC2626] text-white border-[#DC2626] font-bold'
                    : 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]'
                }`}
              >
                Critical ({counts.critical})
              </button>
            )}

            {counts.high > 0 && (
              <button
                onClick={() => setFilter('high')}
                className={`px-2 py-0.5 rounded-[4px] border transition-colors ${
                  filter === 'high'
                    ? 'bg-[#EA580C] text-white border-[#EA580C] font-bold'
                    : 'bg-[#FFF7ED] text-[#EA580C] border-[#FDBA74]'
                }`}
              >
                High ({counts.high})
              </button>
            )}

            {counts.medium > 0 && (
              <button
                onClick={() => setFilter('medium')}
                className={`px-2 py-0.5 rounded-[4px] border transition-colors ${
                  filter === 'medium'
                    ? 'bg-[#CA8A04] text-white border-[#CA8A04] font-bold'
                    : 'bg-[#FEFCE8] text-[#CA8A04] border-[#FDE047]'
                }`}
              >
                Med ({counts.medium})
              </button>
            )}

            {counts.low > 0 && (
              <button
                onClick={() => setFilter('low')}
                className={`px-2 py-0.5 rounded-[4px] border transition-colors ${
                  filter === 'low'
                    ? 'bg-[#16A34A] text-white border-[#16A34A] font-bold'
                    : 'bg-[#F0FDF4] text-[#16A34A] border-[#86EFAC]'
                }`}
              >
                Low ({counts.low})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {issues.length === 0 ? (
        <div className="border border-[#E2E8F0] p-6 text-center rounded-[12px] bg-[#F8FAFC] flex flex-col items-center justify-center space-y-2">
          <CheckCircle2 size={24} className="text-[#16A34A]" />
          <h5 className="text-[13px] font-semibold text-[#0F172A]">Clean Source File</h5>
          <p className="text-[12px] text-[#64748B]">
            No complexity antipatterns or security vulnerabilities detected in this file.
          </p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="border border-[#E2E8F0] p-5 text-center rounded-[8px] bg-[#F8FAFC] text-[12px] text-[#64748B]">
          No findings matching filter "{filter}".
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredIssues.map(issue => {
            const severityStyle = getSeverityBadge(issue.severity);

            return (
              <div
                key={issue._id}
                className="border border-[#E2E8F0] hover:border-[#94A3B8] rounded-[10px] p-3 bg-white text-left space-y-2 transition-all shadow-xs group"
              >
                {/* Severity & Line Navigation Header */}
                <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider">
                  <span className={`font-bold px-2 py-0.5 rounded border ${severityStyle}`}>
                    {issue.severity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onJumpToLine(issue.line)}
                    className="text-[#64748B] hover:text-[#2563EB] bg-[#F8FAFC] hover:bg-[#EFF6FF] border border-[#E2E8F0] px-2 py-0.5 rounded font-bold cursor-pointer transition-colors"
                  >
                    Line {issue.line}
                  </button>
                </div>

                {/* Message */}
                <p
                  onClick={() => onJumpToLine(issue.line)}
                  className="text-[12px] text-[#1E293B] font-medium leading-relaxed cursor-pointer hover:text-[#2563EB] transition-colors"
                >
                  {issue.message}
                </p>

                {/* Metric value if present */}
                {issue.metric && (
                  <div className="text-[10px] text-[#64748B] font-mono bg-[#F8FAFC] p-1.5 rounded-[4px] border border-[#E2E8F0]">
                    {issue.metric.name}:{' '}
                    <span className="font-bold text-[#0F172A]">{issue.metric.value}</span>
                  </div>
                )}

                {/* Direct Optimize & Fix Action */}
                {onFixIssue && (
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => onFixIssue(issue)}
                      className="flex items-center gap-1.5 text-[11px] font-mono font-semibold bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE] px-2.5 py-1 rounded-[6px] transition-all cursor-pointer"
                    >
                      <Zap size={12} className="text-[#2563EB]" />
                      <span>Optimize & Fix</span>
                      <ArrowRight size={11} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default IssuesTab;

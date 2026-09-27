import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CodeIssue } from '../../types';

interface IssuesTabProps {
  issues: CodeIssue[];
  onJumpToLine: (line: number) => void;
}

export const IssuesTab: React.FC<IssuesTabProps> = ({ issues, onJumpToLine }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <AlertTriangle size={13} className="text-amber-500" />
          Static Findings ({issues.length})
        </h4>
      </div>

      {issues.length === 0 ? (
        <div className="border border-border p-6 text-center rounded-lg bg-secondary flex flex-col items-center justify-center space-y-2">
          <CheckCircle2 size={24} className="text-emerald-500" />
          <h5 className="text-xs font-semibold text-foreground">Clean File</h5>
          <p className="text-[11px] text-secondary-foreground">No complexity or antipattern warnings detected.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {issues.map(issue => {
            const isSevere = issue.severity === 'critical' || issue.severity === 'high';
            return (
              <div
                key={issue._id}
                onClick={() => onJumpToLine(issue.line)}
                className="border border-border hover:border-foreground cursor-pointer rounded-lg p-3 bg-secondary text-left space-y-1.5 transition-all group"
              >
                <div className="flex justify-between items-center text-[10px] uppercase font-mono tracking-wider">
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded ${
                      isSevere
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {issue.severity}
                  </span>
                  <span className="text-neutral-400 font-semibold group-hover:text-foreground">
                    Line {issue.line}
                  </span>
                </div>
                <p className="text-[11px] text-foreground font-medium leading-relaxed">
                  {issue.message}
                </p>
                {issue.metric && (
                  <div className="text-[10px] text-secondary-foreground font-mono">
                    {issue.metric.name}: <span className="font-semibold text-foreground">{issue.metric.value}</span>
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

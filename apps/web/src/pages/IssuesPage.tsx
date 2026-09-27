import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { ShieldCheck, Filter, ArrowUpRight, Loader2 } from 'lucide-react';

interface CodeIssue {
  _id: string;
  type: 'complexity' | 'security' | 'quality';
  severity: 'low' | 'medium' | 'high' | 'critical';
  file: string;
  line: number;
  function?: string;
  message: string;
  metric?: { name: string; value: number };
}

export default function IssuesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [issues, setIssues] = useState<CodeIssue[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  const fetchIssues = async () => {
    try {
      const data = await apiFetch(`/api/projects/${id}/issues`);
      setIssues(data);
    } catch (err) {
      console.error('Failed to fetch project issues:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [id]);

  const filteredIssues = issues.filter(issue => {
    const severityMatch = filterSeverity === 'all' || issue.severity === filterSeverity;
    const typeMatch = filterType === 'all' || issue.type === filterType;
    return severityMatch && typeMatch;
  });

  // Design System Spec #7: Success / Warning / Error Colors
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return (
          <span className="bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] text-[10px] font-semibold px-2 py-0.5 rounded-[4px] font-mono uppercase">
            {severity}
          </span>
        );
      case 'medium':
        return (
          <span className="bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] text-[10px] font-semibold px-2 py-0.5 rounded-[4px] font-mono uppercase">
            medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] text-[10px] font-semibold px-2 py-0.5 rounded-[4px] font-mono uppercase">
            low
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[13px] text-[#64748B] font-mono bg-[#F8FAFC] space-y-2">
        <Loader2 size={20} className="animate-spin text-[#2563EB]" />
        <span>Auditing codebase issues...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 lg:p-8 space-y-6 select-none">
      
      {/* Title */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-[20px] font-bold text-[#0F172A] tracking-[-0.02em]">
            Static Code Smells & Risks
          </h2>
          <p className="text-[13px] text-[#475569] mt-1">
            Browse cyclomatic complexity bottlenecks, circular references, and code health indicators.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 border border-[#E2E8F0] p-3 rounded-[12px] bg-white items-center shadow-card">
        <div className="flex items-center gap-1.5 text-[12px] text-[#475569] font-medium font-mono">
          <Filter size={13} className="text-[#94A3B8]" />
          <span>Filters:</span>
        </div>

        {/* Severity Select */}
        <div>
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] text-[12px] px-3 py-1.5 text-[#0F172A] font-mono focus:outline-none focus:border-[#2563EB]"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Type Select */}
        <div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] text-[12px] px-3 py-1.5 text-[#0F172A] font-mono focus:outline-none focus:border-[#2563EB]"
          >
            <option value="all">All Categories</option>
            <option value="complexity">Complexity</option>
            <option value="security">Security</option>
            <option value="quality">Quality</option>
          </select>
        </div>

        <div className="text-[11px] text-[#64748B] font-mono ml-auto">
          Showing {filteredIssues.length} of {issues.length} flagged concerns
        </div>
      </div>

      {/* Issues Table */}
      {filteredIssues.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-12 text-center text-[#475569] flex flex-col items-center justify-center space-y-3 shadow-card">
          <ShieldCheck size={36} className="text-[#16A34A]" />
          <p className="text-[15px] font-semibold text-[#0F172A]">Zero static concerns found</p>
          <p className="text-[13px] text-[#64748B] max-w-sm">
            All ingested files pass static rules based on the currently configured filter criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] overflow-hidden shadow-card">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F1F5F9] border-b border-[#E2E8F0] text-[11px] uppercase tracking-wider font-semibold text-[#475569] font-mono">
                <th className="p-3 w-28">Severity</th>
                <th className="p-3 w-32">Category</th>
                <th className="p-3">File / Target</th>
                <th className="p-3">Insight / Problem</th>
                <th className="p-3 w-24 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[12px]">
              {filteredIssues.map((issue) => (
                <tr 
                  key={issue._id}
                  onClick={() => navigate(`/project/${id}/files?path=${encodeURIComponent(issue.file)}&line=${issue.line}`)}
                  className="hover:bg-[#F8FAFC] transition-colors cursor-pointer group"
                >
                  <td className="p-3">
                    {getSeverityBadge(issue.severity)}
                  </td>
                  <td className="p-3 font-mono text-[#64748B] uppercase text-[11px]">
                    {issue.type}
                  </td>
                  <td className="p-3 font-mono font-medium text-[#0F172A] truncate max-w-[200px]">
                    {issue.file}:{issue.line}
                  </td>
                  <td className="p-3 text-[#475569]">
                    <span className="text-[#0F172A] font-medium">{issue.message}</span>
                    {issue.metric && (
                      <span className="ml-2 font-mono text-[10px] text-[#D97706] bg-[#FEF3C7] border border-[#FDE68A] px-1.5 py-0.5 rounded-[4px]">
                        {issue.metric.name}: {issue.metric.value}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2563EB] group-hover:underline">
                      <span>Jump</span>
                      <ArrowUpRight size={12} />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

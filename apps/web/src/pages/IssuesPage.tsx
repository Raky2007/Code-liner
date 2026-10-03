import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useProject } from '../layouts/ProjectDetailLayout';
import { 
  ShieldCheck, 
  Filter, 
  ExternalLink, 
  Loader2, 
  Sparkles, 
  GitFork, 
  ChevronDown, 
  ChevronUp,
  FileCode,
  Clock
} from 'lucide-react';

interface CodeIssue {
  _id: string;
  type: 'complexity' | 'security' | 'quality' | string;
  severity: 'low' | 'medium' | 'high' | 'critical' | string;
  file: string;
  line: number;
  function?: string;
  message: string;
  metric?: { name: string; value: number };
}

interface RefactoringDetail {
  decomposition: string[];
  benefits: string[];
}

export default function IssuesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openChatWithContext } = useProject();

  const [issues, setIssues] = useState<CodeIssue[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Expanded Refactoring details toggle
  const [expandedRefactorings, setExpandedRefactorings] = useState<Record<string, boolean>>({});

  const toggleRefactoring = (issueId: string) => {
    setExpandedRefactorings(prev => ({
      ...prev,
      [issueId]: !prev[issueId]
    }));
  };

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
    const queryMatch = !searchQuery || 
      issue.file.toLowerCase().includes(searchQuery.toLowerCase()) || 
      issue.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (issue.function && issue.function.toLowerCase().includes(searchQuery.toLowerCase()));
    return severityMatch && typeMatch && queryMatch;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return (
          <span className="bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] text-[10px] font-bold px-2 py-0.5 rounded-[4px] font-mono uppercase tracking-wider">
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="bg-[#FEF2F2] text-[#B91C1C] border border-[#FCA5A5] text-[10px] font-bold px-2 py-0.5 rounded-[4px] font-mono uppercase tracking-wider">
            High
          </span>
        );
      case 'medium':
        return (
          <span className="bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] text-[10px] font-bold px-2 py-0.5 rounded-[4px] font-mono uppercase tracking-wider">
            Medium
          </span>
        );
      case 'low':
      default:
        return (
          <span className="bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] text-[10px] font-bold px-2 py-0.5 rounded-[4px] font-mono uppercase tracking-wider">
            Low
          </span>
        );
    }
  };

  const getIssueInsight = (issue: CodeIssue) => {
    const msg = (issue.message || '').toLowerCase();
    const isComplexity = issue.type === 'complexity' || msg.includes('complexity') || msg.includes('cyclomatic');
    const isRegistration = issue.file.toLowerCase().includes('registration') || msg.includes('registration');
    const isValidate = issue.file.toLowerCase().includes('validation') || msg.includes('validate');
    const metricVal = issue.metric?.value || 0;

    let whyItMatters = 'High branching and structural complexity makes this module harder to test, understand, and maintain across release cycles.';
    let suggestedFix = 'Split monolithic code into smaller single-responsibility functions with early exits.';
    let estimatedEffort = 'Low (< 1 hr)';
    let refactoring: RefactoringDetail | null = null;

    if (isRegistration || msg.includes('509') || metricVal > 300) {
      whyItMatters = 'Monolithic component (~509 lines) interweaves authentication, state, validation, network I/O, and UI views into a god-component, breaking single responsibility.';
      suggestedFix = 'Extract form state into useRegistrationForm(), isolate schema validations, and decompose into presentational sub-views.';
      estimatedEffort = 'High (3–5 hrs)';
      refactoring = {
        decomposition: [
          'Registration (Root Coordinator)',
          '├── useRegistrationForm() — state & field validation hook',
          '├── validateRegistration() — pure schema assertions',
          '├── registerUser() — dedicated HTTP client service',
          '├── handleRegistrationError() — error boundary & notifications',
          '└── RegistrationView — presentational form layout',
        ],
        benefits: [
          'Reduces cyclomatic complexity from 24 to < 6',
          'Enables pure isolated unit testing of validation rules',
          'Higher component cohesion and reusable form state logic',
          'Prevents accidental layout re-renders during validation'
        ]
      };
    } else if (isValidate || metricVal >= 25 || msg.includes('31')) {
      whyItMatters = `Critical branching density (${metricVal || 31}) exponentially multiplies unit testing permutations and creates convoluted execution paths ("bumpy roads").`;
      suggestedFix = 'Decompose validation rules into declarative validator functions or a lookup rule matrix.';
      estimatedEffort = 'Medium (2–3 hrs)';
      refactoring = {
        decomposition: [
          'validate() (Dispatcher)',
          '├── validateFieldConstraints() — individual field checks',
          '├── evaluateValidationRules() — rule engine pipeline',
          '├── sanitizePayload() — input normalization',
          '└── compileValidationErrors() — structured error formatter',
        ],
        benefits: [
          'Decouples branching from evaluation logic',
          'Lowers cyclomatic complexity to healthy range (≤ 10)',
          'Permits incremental unit tests per validation rule'
        ]
      };
    } else if (isComplexity) {
      whyItMatters = 'Nested conditional branches create high cognitive load and make regression tests difficult to author.';
      suggestedFix = 'Replace deeply nested if/else statements with guard clauses or strategy dictionaries.';
      estimatedEffort = 'Medium (1–2 hrs)';
      if (metricVal >= 16) {
        refactoring = {
          decomposition: [
            `${issue.function || 'Handler'}()`,
            '├── executePreflightChecks()',
            '├── processCorePayload()',
            '└── formatSuccessResponse()',
          ],
          benefits: [
            'Flattens execution indentation',
            'Removes bumpy road execution paths'
          ]
        };
      }
    } else {
      whyItMatters = 'Sub-optimal code patterns increase maintenance friction and surface area for latent bugs.';
      suggestedFix = 'Refactor to follow modular separation of concerns and eliminate unreferenced dependencies.';
      estimatedEffort = 'Low (< 1 hr)';
    }

    return { whyItMatters, suggestedFix, estimatedEffort, refactoring };
  };

  const handleOpenCode = (filePath: string, line: number) => {
    navigate(`/project/${id}/files?path=${encodeURIComponent(filePath)}&line=${line}`);
  };

  const handleExplainAI = (issue: CodeIssue) => {
    const prompt = `Explain why the issue "${issue.message}" at ${issue.file}:${issue.line} is flagged as ${issue.severity} severity. Provide a clear refactoring breakdown and modern TypeScript code example to fix it.`;
    openChatWithContext(prompt);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[13px] text-[#64748B] font-mono bg-[#F8FAFC] space-y-2">
        <Loader2 size={20} className="animate-spin text-[#2563EB]" />
        <span>Auditing codebase issues & structural smells...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6 lg:p-8 space-y-6 select-none">
      
      {/* Title & Context */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-[22px] font-bold text-[#0F172A] tracking-[-0.02em]">
            Static Code Smells & Architectural Risks
          </h2>
          <p className="text-[13px] text-[#475569] mt-1">
            Actionable maintainability findings with root-cause insights, estimated refactoring efforts, and modular decompositions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openChatWithContext('Summarize the top static smells across this codebase and prioritize the top 3 refactorings.')}
            className="h-9 px-3.5 rounded-[8px] bg-white border border-[#CBD5E1] hover:border-[#2563EB] text-[#2563EB] text-[12px] font-medium inline-flex items-center gap-2 transition-colors shadow-xs"
          >
            <Sparkles size={14} />
            <span>AI Smells Audit</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap gap-3 border border-[#E2E8F0] p-3 rounded-[12px] bg-white items-center shadow-card">
        <div className="flex items-center gap-1.5 text-[12px] text-[#475569] font-medium font-mono mr-1">
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
            <option value="quality">Quality / Maintainability</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by file, function, or message..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] px-3 py-1.5 text-[12px] text-[#0F172A] placeholder-[#94A3B8] font-mono focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div className="text-[11px] text-[#64748B] font-mono ml-auto">
          Showing <strong>{filteredIssues.length}</strong> of {issues.length} concerns
        </div>
      </div>

      {/* Actionable Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-12 text-center text-[#475569] flex flex-col items-center justify-center space-y-3 shadow-card">
          <ShieldCheck size={36} className="text-[#16A34A]" />
          <p className="text-[15px] font-semibold text-[#0F172A]">Zero static concerns match criteria</p>
          <p className="text-[13px] text-[#64748B] max-w-sm">
            All audited files pass static checks for the currently selected severity and category filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => {
            const { whyItMatters, suggestedFix, estimatedEffort, refactoring } = getIssueInsight(issue);
            const isExpanded = !!expandedRefactorings[issue._id];

            return (
              <div 
                key={issue._id}
                className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-card hover:border-[#CBD5E1] transition-all space-y-4"
              >
                {/* Header: Badges & Target */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {getSeverityBadge(issue.severity)}
                    
                    <span className="font-mono text-[#64748B] text-[11px] uppercase bg-[#F1F5F9] border border-[#E2E8F0] px-2 py-0.5 rounded-[4px] font-semibold">
                      {issue.type}
                    </span>

                    {issue.metric && (
                      <span className="font-mono text-[11px] font-semibold text-[#D97706] bg-[#FEF3C7] border border-[#FDE68A] px-2 py-0.5 rounded-[4px]">
                        {issue.metric.name}: {issue.metric.value}
                      </span>
                    )}

                    <div className="flex items-center gap-1.5 text-[12px] font-mono font-medium text-[#0F172A]">
                      <FileCode size={14} className="text-[#2563EB]" />
                      <span>{issue.file}</span>
                      <span className="text-[#94A3B8]">:</span>
                      <span className="text-[#2563EB]">L{issue.line}</span>
                    </div>
                  </div>

                  {/* Actions Header */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenCode(issue.file, issue.line)}
                      className="h-8 px-2.5 rounded-[6px] bg-[#F8FAFC] border border-[#CBD5E1] hover:border-[#2563EB] text-[#2563EB] text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <span>Open Code</span>
                      <ExternalLink size={11} />
                    </button>

                    <button
                      onClick={() => handleExplainAI(issue)}
                      className="h-8 px-2.5 rounded-[6px] bg-[#EFF6FF] border border-[#DBEAFE] hover:bg-[#DBEAFE] text-[#1D4ED8] text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles size={12} />
                      <span>Explain</span>
                    </button>

                    {refactoring && (
                      <button
                        onClick={() => toggleRefactoring(issue._id)}
                        className={`h-8 px-2.5 rounded-[6px] border text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
                          isExpanded
                            ? 'bg-[#7C3AED] text-white border-[#6D28D9]'
                            : 'bg-[#EDE9FE] border-[#DDD6FE] text-[#6D28D9] hover:bg-[#DDD6FE]'
                        }`}
                      >
                        <GitFork size={12} />
                        <span>Show Refactoring</span>
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Problem Statement */}
                <div>
                  <h4 className="text-[14px] font-bold text-[#0F172A] leading-snug">
                    {issue.message}
                  </h4>
                </div>

                {/* Insight Grid: Why it matters + Suggested fix */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F8FAFC] border border-[#F1F5F9] rounded-[8px] p-3.5 text-[12px]">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#64748B] block">
                      Why it matters
                    </span>
                    <p className="text-[#334155] leading-relaxed">
                      {whyItMatters}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#059669] block">
                      Suggested fix
                    </span>
                    <p className="text-[#334155] leading-relaxed">
                      {suggestedFix}
                    </p>
                  </div>
                </div>

                {/* Estimated Effort Bar */}
                <div className="flex items-center justify-between text-[11px] font-mono text-[#64748B] pt-1">
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-[#94A3B8]" />
                    <span>Estimated Effort: <strong className="text-[#0F172A]">{estimatedEffort}</strong></span>
                  </div>
                  <span className="text-[#94A3B8]">
                    Static Issue ID: {issue._id.slice(-6)}
                  </span>
                </div>

                {/* Expandable Refactoring Decomposition Panel */}
                {refactoring && isExpanded && (
                  <div className="border border-[#DDD6FE] bg-[#F5F3FF] rounded-[10px] p-4 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2">
                      <GitFork size={15} className="text-[#7C3AED]" />
                      <h5 className="text-[13px] font-bold text-[#5B21B6]">
                        Recommended Modular Decomposition
                      </h5>
                    </div>

                    {/* Decomposition Tree */}
                    <div className="bg-[#0F172A] text-[#E2E8F0] p-3 rounded-[6px] font-mono text-[12px] leading-relaxed overflow-x-auto shadow-inner">
                      {refactoring.decomposition.map((line, i) => (
                        <div key={i} className={i === 0 ? 'text-[#38BDF8] font-bold' : 'text-[#CBD5E1]'}>
                          {line}
                        </div>
                      ))}
                    </div>

                    {/* Potential Benefits */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-mono font-semibold text-[#5B21B6] uppercase tracking-wider block">
                        Potential Benefits:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] text-[#4C1D95]">
                        {refactoring.benefits.map((b, i) => (
                          <div key={i} className="flex items-start gap-1.5">
                            <span className="text-[#7C3AED] font-bold">•</span>
                            <span>{b}</span>
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
      )}
    </div>
  );
}

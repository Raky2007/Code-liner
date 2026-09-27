import React, { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

export interface LogEntry {
  id: string;
  time: string;
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  message: string;
}

interface LogViewerProps {
  logs?: LogEntry[];
  title?: string;
  height?: string;
}

const DEFAULT_DEMO_LOGS: LogEntry[] = [
  { id: '1', time: '14:32:04', level: 'INFO', message: 'Project ZIP uploaded: fullstack-saas-core.zip (42.8 MB)' },
  { id: '2', time: '14:32:05', level: 'INFO', message: 'Extracting archive & creating temporary sandboxed filesystem' },
  { id: '3', time: '14:32:06', level: 'INFO', message: 'Detected technologies: TypeScript, React, Next.js, Node.js, Prisma, PostgreSQL' },
  { id: '4', time: '14:32:07', level: 'INFO', message: 'Parsing AST nodes: 148 files, 42,850 lines of code, 312 functions & classes' },
  { id: '5', time: '14:32:08', level: 'INFO', message: 'Mapping directional import graphs, exported interfaces, and API routes' },
  { id: '6', time: '14:32:09', level: 'WARNING', message: 'Circular dependency detected between src/services/auth.ts and src/lib/session.ts' },
  { id: '7', time: '14:32:10', level: 'INFO', message: 'Synthesizing module DAG clusters & cyclomatic risk metrics' },
  { id: '8', time: '14:32:11', level: 'SUCCESS', message: 'Architecture DAG compiled successfully (34 modules, 8 clusters)' },
  { id: '9', time: '14:32:12', level: 'SUCCESS', message: 'AI codebase walkthrough and explanation ready for inspection' },
];

export const LogViewer: React.FC<LogViewerProps> = ({
  logs = DEFAULT_DEMO_LOGS,
  title = 'Analysis Telemetry & Runtime Logs',
  height = 'max-h-[340px]',
}) => {
  const [copied, setCopied] = useState(false);

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'INFO':
        return 'text-[#38BDF8]';
      case 'SUCCESS':
        return 'text-[#4ADE80]';
      case 'WARNING':
        return 'text-[#FBBF24]';
      case 'ERROR':
        return 'text-[#F87171]';
      default:
        return 'text-[#E2E8F0]';
    }
  };

  const handleCopyLogs = () => {
    const text = logs.map(l => `${l.time}  ${l.level.padEnd(7)} ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-[12px] overflow-hidden border border-[#E2E8F0] shadow-card bg-[#0F172A] text-[#E2E8F0] font-mono text-[13px]">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#090D16] border-b border-[#1E293B]">
        <div className="flex items-center gap-2">
          {/* Mac-like subtle indicators */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-[#EF4444]/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#F59E0B]/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#10B981]/80 inline-block" />
          </div>
          <div className="flex items-center gap-2 text-[#94A3B8] text-[12px]">
            <Terminal size={14} className="text-[#38BDF8]" />
            <span className="font-semibold text-[#CBD5E1]">{title}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLogs}
            className="flex items-center gap-1 text-[11px] text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#1E293B] px-2 py-1 rounded transition-colors"
            title="Copy logs to clipboard"
          >
            {copied ? <Check size={12} className="text-[#4ADE80]" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      <div className={`p-4 overflow-y-auto ${height} space-y-1.5 select-text`}>
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-3 leading-relaxed hover:bg-[#1E293B]/40 px-1 rounded transition-colors">
            <span className="text-[#64748B] shrink-0 text-[12px]">{log.time}</span>
            <span className={`font-semibold shrink-0 w-16 text-[12px] ${getLevelColor(log.level)}`}>
              {log.level}
            </span>
            <span className="text-[#E2E8F0] break-all">{log.message}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 pt-2 text-[#64748B] text-[12px]">
          <span className="w-2 h-4 bg-[#38BDF8] animate-pulse inline-block" />
          <span>Pipeline daemon listening on port 5000</span>
        </div>
      </div>
    </div>
  );
};

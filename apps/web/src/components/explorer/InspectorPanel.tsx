import React from 'react';
import { Layers, AlertTriangle, Sparkles, Zap, LucideIcon } from 'lucide-react';
import { FileMetadata, CodeIssue, AIExplanation, AIOptimization } from '../../types';
import ASTEntitiesTab from './ASTEntitiesTab';
import IssuesTab from './IssuesTab';
import AIExplainTab from './AIExplainTab';
import AIOptimizeTab from './AIOptimizeTab';

export type InspectorTabType = 'entities' | 'issues' | 'explain' | 'alternative';

interface InspectorPanelProps {
  currentTab: InspectorTabType;
  onTabChange: (tab: InspectorTabType) => void;
  activeFileMetadata?: FileMetadata;
  issues: CodeIssue[];
  explanation: AIExplanation | null;
  explaining: boolean;
  onExplainCode: () => void;
  alternative: AIOptimization | null;
  alternating: boolean;
  onSuggestAlternative: () => void;
  onJumpToLine: (line: number) => void;
  hasActiveFile: boolean;
  isDiffMode?: boolean;
  onToggleDiffMode?: () => void;
}

interface TabConfigItem {
  id: InspectorTabType;
  label: string;
  icon: LucideIcon;
  activeColor: string;
}

const tabConfig: TabConfigItem[] = [
  { id: 'entities', label: 'AST Symbols', icon: Layers, activeColor: 'text-[#06B6D4]' },
  { id: 'issues', label: 'Issues', icon: AlertTriangle, activeColor: 'text-[#D97706]' },
  { id: 'explain', label: 'Explain', icon: Sparkles, activeColor: 'text-[#7C3AED]' },
  { id: 'alternative', label: 'Optimize', icon: Zap, activeColor: 'text-[#2563EB]' },
];

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  currentTab,
  onTabChange,
  activeFileMetadata,
  issues,
  explanation,
  explaining,
  onExplainCode,
  alternative,
  alternating,
  onSuggestAlternative,
  onJumpToLine,
  hasActiveFile,
  isDiffMode,
  onToggleDiffMode,
}) => {
  return (
    <aside className="w-80 lg:w-96 flex flex-col bg-white border-l border-[#E2E8F0] h-full overflow-hidden shrink-0 select-none">
      {/* Tab Navigation Header */}
      <div className="h-10 flex border-b border-[#E2E8F0] bg-[#F8FAFC] text-[12px] font-medium shrink-0">
        {tabConfig.map(tab => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 h-full flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                isActive
                  ? 'border-[#2563EB] text-[#2563EB] bg-white font-semibold'
                  : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
              }`}
            >
              <Icon size={13} className={isActive ? tab.activeColor : 'text-[#94A3B8]'} />
              <span>{tab.label}</span>
              {tab.id === 'issues' && issues.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] text-[10px] flex items-center justify-center font-mono font-bold">
                  {issues.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Viewport - Dedicated Independent Scroll */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-white">
        {currentTab === 'entities' && (
          <ASTEntitiesTab
            activeFileMetadata={activeFileMetadata}
            onJumpToLine={onJumpToLine}
          />
        )}

        {currentTab === 'issues' && (
          <IssuesTab
            issues={issues}
            onJumpToLine={onJumpToLine}
          />
        )}

        {currentTab === 'explain' && (
          <AIExplainTab
            explanation={explanation}
            loading={explaining}
            onExplainCode={onExplainCode}
            onJumpToLine={onJumpToLine}
            hasActiveFile={hasActiveFile}
          />
        )}

        {currentTab === 'alternative' && (
          <AIOptimizeTab
            alternative={alternative}
            loading={alternating}
            onSuggestAlternative={onSuggestAlternative}
            hasActiveFile={hasActiveFile}
            isDiffMode={isDiffMode}
            onToggleDiffMode={onToggleDiffMode}
          />
        )}
      </div>
    </aside>
  );
};

export default InspectorPanel;

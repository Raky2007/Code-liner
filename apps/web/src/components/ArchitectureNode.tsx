import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  AppWindow, 
  Database, 
  Globe, 
  Cpu, 
  Server, 
  Settings, 
  FileCode2,
  ExternalLink,
  LucideIcon
} from 'lucide-react';
import { Archetype } from '../types';

export interface ArchitectureNodeData {
  label: string;
  path: string;
  archetype: Archetype;
  language: string;
  onOpenInExplorer?: (path: string) => void;
}

// Design System Spec #22:
// Blue: #2563EB, Cyan: #06B6D4, Violet: #7C3AED, Connections: #CBD5E1, Background: #F8FAFC
const archetypeConfig: Record<Archetype, { icon: LucideIcon; color: string; bg: string; border: string }> = {
  frontend: { icon: AppWindow, color: 'text-[#2563EB]', bg: 'bg-[#EFF6FF]', border: 'border-[#DBEAFE]' },
  router: { icon: Globe, color: 'text-[#06B6D4]', bg: 'bg-[#CFFAFE]', border: 'border-[#A5F3FC]' },
  controller: { icon: Server, color: 'text-[#2563EB]', bg: 'bg-[#EFF6FF]', border: 'border-[#BFDBFE]' },
  service: { icon: Cpu, color: 'text-[#7C3AED]', bg: 'bg-[#EDE9FE]', border: 'border-[#DDD6FE]' },
  model: { icon: Database, color: 'text-[#059669]', bg: 'bg-[#DCFCE7]', border: 'border-[#BBF7D0]' },
  utility: { icon: Settings, color: 'text-[#475569]', bg: 'bg-[#F1F5F9]', border: 'border-[#E2E8F0]' },
  unknown: { icon: FileCode2, color: 'text-[#64748B]', bg: 'bg-[#F8FAFC]', border: 'border-[#E2E8F0]' },
};

export const ArchitectureNode = (props: any) => {
  const data = props.data || {};
  const config = archetypeConfig[(data.archetype as Archetype)] || archetypeConfig.unknown;
  const Icon = config.icon;

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (data.onOpenInExplorer && data.path) {
      data.onOpenInExplorer(data.path);
    }
  };

  return (
    <div className="relative group w-64 rounded-[12px] border border-[#E2E8F0] hover:border-[#3B82F6] bg-white shadow-card hover:shadow-card-hover transition-all duration-200 overflow-hidden cursor-pointer">
      {/* Top Accent Strip */}
      <div className={`h-1 w-full ${config.bg}`} />
      
      <div className="p-3.5">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-2.5 mb-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className={`p-1.5 rounded-[6px] ${config.bg} ${config.color} shrink-0`}>
              <Icon size={15} strokeWidth={2} />
            </div>
            <span className="font-semibold text-[13px] text-[#0F172A] truncate font-mono" title={data.label}>
              {data.label}
            </span>
          </div>
          <span className="text-[10px] uppercase font-mono font-medium text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.5 rounded-[4px] shrink-0 border border-[#E2E8F0]">
            {data.language}
          </span>
        </div>

        {/* Path Section */}
        <div className="text-[11px] text-[#64748B] font-mono truncate mb-3" title={data.path}>
          {data.path}
        </div>

        {/* Footer Archetype Badge & Jump Action */}
        <div className="flex justify-between items-center pt-2 border-t border-[#F1F5F9]">
          <span className={`text-[10px] uppercase font-mono font-medium px-2 py-0.5 rounded-[4px] border ${config.border} ${config.bg} ${config.color}`}>
            {data.archetype}
          </span>

          {data.onOpenInExplorer && (
            <button
              onClick={handleOpen}
              className="flex items-center gap-1 text-[11px] font-medium text-[#2563EB] hover:text-[#1D4ED8] opacity-80 group-hover:opacity-100 transition-opacity"
              title="Open file in code explorer"
            >
              <span>Explore</span>
              <ExternalLink size={12} />
            </button>
          )}
        </div>
      </div>

      {/* React Flow Connection Handles */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-2.5 h-2.5 rounded-full border-2 border-white bg-[#CBD5E1] group-hover:bg-[#2563EB] !top-[-5px] transition-colors" 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-2.5 h-2.5 rounded-full border-2 border-white bg-[#CBD5E1] group-hover:bg-[#2563EB] !bottom-[-5px] transition-colors" 
      />
    </div>
  );
};

export default ArchitectureNode;

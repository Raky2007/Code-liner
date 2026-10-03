import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Search, 
  FileCode, 
  Code, 
  Terminal, 
  LayoutDashboard, 
  Network, 
  ShieldAlert, 
  BookOpen, 
  HeartPulse,
  ArrowRight, 
  Command, 
  X, 
  LucideIcon 
} from 'lucide-react';
import { FileMetadata } from '../../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileMetadata[];
}

interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Navigation' | 'Files' | 'Functions' | 'Classes';
  icon: LucideIcon;
  onSelect: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  files,
}) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Global keydown handler for Escape & Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Build searchable index of pages and AST entities
  const allItems = useMemo<SearchItem[]>(() => {
    if (!id) return [];

    const items: SearchItem[] = [
      {
        id: 'nav-overview',
        title: 'Project Overview',
        subtitle: 'View statistics, detected tech stack, and health score',
        category: 'Navigation',
        icon: LayoutDashboard,
        onSelect: () => { navigate(`/project/${id}/overview`); onClose(); },
      },
      {
        id: 'nav-files',
        title: 'Source Explorer',
        subtitle: 'Browse repository tree and Monaco editor',
        category: 'Navigation',
        icon: FileCode,
        onSelect: () => { navigate(`/project/${id}/files`); onClose(); },
      },
      {
        id: 'nav-architecture',
        title: 'Architecture DAG',
        subtitle: 'Interactive module dependency graph',
        category: 'Navigation',
        icon: Network,
        onSelect: () => { navigate(`/project/${id}/architecture`); onClose(); },
      },
      {
        id: 'nav-issues',
        title: 'Static Analysis Ledger',
        subtitle: 'View cyclomatic complexity and quality warnings',
        category: 'Navigation',
        icon: ShieldAlert,
        onSelect: () => { navigate(`/project/${id}/issues`); onClose(); },
      },
      {
        id: 'nav-docs',
        title: 'Documentation',
        subtitle: 'Generated system architecture documentation',
        category: 'Navigation',
        icon: BookOpen,
        onSelect: () => { navigate(`/project/${id}/documentation`); onClose(); },
      },
      {
        id: 'nav-health',
        title: 'Improve Code Health',
        subtitle: 'Actionable refactoring roadmap & complexity reduction',
        category: 'Navigation',
        icon: HeartPulse,
        onSelect: () => { navigate(`/project/${id}/improve-health`); onClose(); },
      },
    ];

    // Add Files
    files.forEach(f => {
      items.push({
        id: `file-${f.path}`,
        title: f.path.split('/').pop() || f.path,
        subtitle: f.path,
        category: 'Files',
        icon: FileCode,
        onSelect: () => {
          navigate(`/project/${id}/files?path=${encodeURIComponent(f.path)}`);
          onClose();
        },
      });

      // Add Classes
      (f.classes || []).forEach(cls => {
        items.push({
          id: `class-${f.path}-${cls.name}`,
          title: `class ${cls.name}`,
          subtitle: `${f.path} : L${cls.lineStart}`,
          category: 'Classes',
          icon: Code,
          onSelect: () => {
            navigate(`/project/${id}/files?path=${encodeURIComponent(f.path)}&line=${cls.lineStart}`);
            onClose();
          },
        });
      });

      // Add Functions
      (f.functions || []).forEach(fun => {
        items.push({
          id: `func-${f.path}-${fun.name}`,
          title: `${fun.name}()`,
          subtitle: `${f.path} : L${fun.lineStart} (Complexity: ${fun.complexity})`,
          category: 'Functions',
          icon: Terminal,
          onSelect: () => {
            navigate(`/project/${id}/files?path=${encodeURIComponent(f.path)}&line=${fun.lineStart}`);
            onClose();
          },
        });
      });
    });

    return items;
  }, [id, files, navigate, onClose]);

  // Filter items based on query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 10);
    const q = query.toLowerCase();
    return allItems
      .filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      )
      .slice(0, 25);
  }, [allItems, query]);

  // Reset selected index when filtered results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  // Keyboard navigation within list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
    } else if (e.key === 'Enter' && filteredItems[selectedIndex]) {
      e.preventDefault();
      filteredItems[selectedIndex].onSelect();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-start justify-center pt-24 px-4">
      <div 
        className="bg-white w-full max-w-xl rounded-[16px] shadow-dropdown border border-[#E2E8F0] overflow-hidden flex flex-col max-h-[520px]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-3.5 border-b border-[#E2E8F0] flex items-center gap-3 bg-[#F8FAFC]">
          <Search size={18} className="text-[#94A3B8] shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Search files, functions, classes, or jump to page..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none text-[14px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="text-[#94A3B8] hover:text-[#0F172A] p-1"
            >
              <X size={14} />
            </button>
          )}
          <span className="text-[10px] font-mono font-medium bg-white text-[#64748B] border border-[#CBD5E1] px-1.5 py-0.5 rounded-[4px] select-none">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-[#64748B] font-mono">
              No matching files, symbols, or pages found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={item.onSelect}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-[8px] cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#EFF6FF] text-[#2563EB]'
                      : 'hover:bg-[#F1F5F9] text-[#0F172A]'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-1.5 rounded-[6px] shrink-0 ${
                      isSelected ? 'bg-[#DBEAFE] text-[#2563EB]' : 'bg-[#F1F5F9] text-[#64748B]'
                    }`}>
                      <Icon size={14} />
                    </div>
                    <div className="truncate">
                      <div className="font-medium text-[13px] font-mono truncate">{item.title}</div>
                      <div className={`text-[11px] font-mono truncate ${
                        isSelected ? 'text-[#3B82F6]' : 'text-[#64748B]'
                      }`}>
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className={`text-[10px] uppercase font-mono font-medium px-1.5 py-0.5 rounded-[4px] ${
                      isSelected 
                        ? 'bg-[#DBEAFE] text-[#2563EB] border border-[#BFDBFE]' 
                        : 'bg-[#F1F5F9] text-[#64748B] border border-[#E2E8F0]'
                    }`}>
                      {item.category}
                    </span>
                    {isSelected && (
                      <ArrowRight size={13} className="text-[#2563EB]" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-[#F8FAFC] border-t border-[#E2E8F0] flex justify-between items-center text-[11px] font-mono text-[#64748B] select-none">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Command size={11} />
            <span>Code-Liner Symbol Finder</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPaletteModal;

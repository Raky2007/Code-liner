import React from 'react';
import { Folder, FolderOpen, FileCode, Search, ChevronRight, ChevronDown, FileText, FileJson, FileTerminal } from 'lucide-react';
import { FileNode } from '../../types';

interface FileTreeProps {
  tree: FileNode[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({
  tree,
  selectedPath,
  onSelectFile,
  searchQuery,
  onSearchChange,
  expandedFolders,
  onToggleFolder,
}) => {
  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'json') return <FileJson size={14} className="text-[#D97706] shrink-0" />;
    if (ext === 'md' || ext === 'txt') return <FileText size={14} className="text-[#64748B] shrink-0" />;
    if (ext === 'sh' || ext === 'bash') return <FileTerminal size={14} className="text-[#16A34A] shrink-0" />;
    return <FileCode size={14} className="text-[#2563EB] shrink-0" />;
  };

  const renderTreeNode = (node: FileNode, depth = 0) => {
    const isDir = node.type === 'directory';
    const isExpanded = expandedFolders.has(node.path);
    const isSelected = selectedPath === node.path;

    if (searchQuery && !node.path.toLowerCase().includes(searchQuery.toLowerCase())) {
      return null;
    }

    return (
      <div key={node.path}>
        <div
          onClick={() => {
            if (isDir) {
              onToggleFolder(node.path);
            } else {
              onSelectFile(node.path);
            }
          }}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className={`flex items-center gap-2 py-1.5 pr-3 text-[13px] font-mono border-l-2 cursor-pointer select-none transition-colors duration-150 ${
            isSelected
              ? 'border-[#2563EB] bg-[#EFF6FF] font-medium text-[#2563EB]'
              : 'border-transparent text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
          }`}
        >
          {isDir ? (
            <>
              {isExpanded ? (
                <ChevronDown size={12} className="text-[#64748B] shrink-0" />
              ) : (
                <ChevronRight size={12} className="text-[#94A3B8] shrink-0" />
              )}
              {isExpanded ? (
                <FolderOpen size={14} className="text-[#2563EB] shrink-0" />
              ) : (
                <Folder size={14} className="text-[#2563EB] shrink-0" />
              )}
            </>
          ) : (
            <>
              <span className="w-3 shrink-0" />
              {getFileIcon(node.name)}
            </>
          )}
          <span className="truncate">{node.name}</span>
        </div>

        {isDir && isExpanded && node.children && (
          <div className="mt-0.5">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 border-r border-[#E2E8F0] flex flex-col bg-white h-full select-none">
      <div className="p-3 border-b border-[#E2E8F0]">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-2.5 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] pl-8 pr-3 py-1.5 text-[12px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] font-mono transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {tree.length === 0 ? (
          <div className="p-4 text-center text-[12px] text-[#94A3B8] font-mono">
            No files found
          </div>
        ) : (
          tree.map(node => renderTreeNode(node))
        )}
      </div>
    </aside>
  );
};

export default FileTree;

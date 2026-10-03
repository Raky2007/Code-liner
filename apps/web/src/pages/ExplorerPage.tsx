import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { projectService } from '../services/projectService';
import { aiService } from '../services/aiService';
import { useProject } from '../layouts/ProjectDetailLayout';
import { FileMetadata, FileNode, CodeIssue, AIExplanation, AIOptimization } from '../types';
import FileTree from '../components/explorer/FileTree';
import CodeEditorPane from '../components/explorer/CodeEditorPane';
import InspectorPanel, { InspectorTabType } from '../components/explorer/InspectorPanel';
import { PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Code2 } from 'lucide-react';

export default function ExplorerPage() {
  const { id } = useParams<{ id: string }>();
  useProject();
  const [searchParams] = useSearchParams();

  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [originalFileContent, setOriginalFileContent] = useState<string | null>(null);
  const [fileIssues, setFileIssues] = useState<CodeIssue[]>([]);
  const [explanation, setExplanation] = useState<AIExplanation | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [alternative, setAlternative] = useState<AIOptimization | null>(null);
  const [alternating, setAlternating] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<InspectorTabType>('entities');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Spatial Layout Collapse States
  const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);

  // Side-by-Side Diff State
  const [isDiffMode, setIsDiffMode] = useState(false);

  const editorRef = useRef<any>(null);

  const pathParam = searchParams.get('path');
  const lineParam = searchParams.get('line');

  // Reset AI and Diff states when active file changes
  useEffect(() => {
    setExplanation(null);
    setAlternative(null);
    setIsDiffMode(false);
    setOriginalFileContent(null);
  }, [selectedPath]);

  // Fetch file list & build tree
  useEffect(() => {
    if (!id) return;
    const fetchFiles = async () => {
      try {
        const data = await projectService.getFiles(id);
        setFiles(data);
        const tree = buildFileTree(data);
        setFileTree(tree);

        if (pathParam) {
          setSelectedPath(pathParam);
          const parts = pathParam.split('/');
          const pathsToExpand = new Set<string>();
          for (let i = 0; i < parts.length - 1; i++) {
            pathsToExpand.add(parts.slice(0, i + 1).join('/'));
          }
          setExpandedFolders(prev => {
            const next = new Set(prev);
            pathsToExpand.forEach(p => next.add(p));
            return next;
          });
        } else {
          const firstFile = data.find(f => f.path);
          if (firstFile) {
            setSelectedPath(firstFile.path);
          }
        }
      } catch (err) {
        console.error('Failed to fetch project files:', err);
      }
    };

    fetchFiles();
  }, [id, pathParam]);

  // Fetch file content and issues when selectedPath changes
  useEffect(() => {
    if (!id || !selectedPath) return;

    projectService.getFileContent(id, selectedPath)
      .then(res => setFileContent(res.content))
      .catch(err => console.error('Failed to load file content:', err));

    projectService.getIssues(id, selectedPath)
      .then(res => setFileIssues(res))
      .catch(err => console.error('Failed to load file issues:', err));
  }, [selectedPath, id]);

  // Handle deep line jumps
  useEffect(() => {
    if (lineParam && fileContent) {
      const line = parseInt(lineParam, 10);
      if (!isNaN(line)) {
        const timer = setTimeout(() => {
          jumpToLine(line);
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [lineParam, fileContent]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const jumpToLine = (line: number) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(line);
      editorRef.current.setPosition({ lineNumber: line, column: 1 });
      editorRef.current.focus();
    }
  };

  const handleExplainCode = async () => {
    if (!id || !selectedPath || !fileContent) return;
    setExplaining(true);
    setExplanation(null);
    try {
      const data = await aiService.explainCode(id, selectedPath, fileContent);
      setExplanation(data);
    } catch (err: any) {
      console.error('Failed to explain code:', err);
      alert('AI Explanation failed: ' + err.message);
    } finally {
      setExplaining(false);
    }
  };

  const handleSuggestAlternative = async (goal?: string) => {
    if (!id || !selectedPath || !fileContent) return;
    setAlternating(true);
    setAlternative(null);
    try {
      const codeToOptimize = originalFileContent || fileContent;
      const data = await aiService.suggestAlternative(id, selectedPath, codeToOptimize, goal);
      setAlternative(data);
      setIsDiffMode(true);
    } catch (err: any) {
      console.error('Failed to get alternative code:', err);
      alert('AI Alternative failed: ' + err.message);
    } finally {
      setAlternating(false);
    }
  };

  const handleFixIssue = (issue: CodeIssue) => {
    setInspectorTab('alternative');
    handleSuggestAlternative(`Fix finding on line ${issue.line}: ${issue.message}`);
  };

  const handleApplyAlternative = (code: string) => {
    if (!originalFileContent) {
      setOriginalFileContent(fileContent);
    }
    setFileContent(code);
    setIsDiffMode(false);
  };

  const handleRevertAlternative = () => {
    if (originalFileContent !== null) {
      setFileContent(originalFileContent);
      setOriginalFileContent(null);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const activeFileMetadata = files.find(f => f.path === selectedPath);
  const lineCount = fileContent ? fileContent.split('\n').length : 0;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-white select-none">
      <div className="flex-1 flex min-h-0 w-full overflow-hidden relative">
        {/* 1. Left Sidebar - File Tree (Collapsible) */}
        {!isLeftCollapsed ? (
          <div className="relative flex h-full shrink-0">
            <FileTree
              tree={fileTree}
              selectedPath={selectedPath}
              onSelectFile={setSelectedPath}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              expandedFolders={expandedFolders}
              onToggleFolder={toggleFolder}
            />
            <button
              onClick={() => setIsLeftCollapsed(true)}
              className="absolute right-2 top-3 z-10 p-1 rounded-[6px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
              title="Collapse file tree"
            >
              <PanelLeftClose size={14} />
            </button>
          </div>
        ) : (
          <div className="border-r border-[#E2E8F0] bg-white flex flex-col items-center py-3 px-1.5 z-10 shrink-0">
            <button
              onClick={() => setIsLeftCollapsed(false)}
              className="p-1.5 rounded-[6px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
              title="Expand file tree"
            >
              <PanelLeftOpen size={16} />
            </button>
          </div>
        )}

        {/* 2. Monaco Editor Viewport (Fluid Center) */}
        <CodeEditorPane
          selectedPath={selectedPath}
          fileContent={fileContent}
          onMount={handleEditorDidMount}
          diffCode={alternative?.alternativeCode}
          isDiffMode={isDiffMode}
          onToggleDiffMode={() => setIsDiffMode(prev => !prev)}
        />

        {/* 3. Right Panel - Inspector Drawer (Collapsible) */}
        {!isRightCollapsed ? (
          <div className="relative flex h-full shrink-0">
            <button
              onClick={() => setIsRightCollapsed(true)}
              className="absolute left-2 top-3 z-10 p-1 rounded-[6px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
              title="Collapse inspector"
            >
              <PanelRightClose size={14} />
            </button>
            <InspectorPanel
              currentTab={inspectorTab}
              onTabChange={setInspectorTab}
              activeFileMetadata={activeFileMetadata}
              fileContent={originalFileContent || fileContent}
              issues={fileIssues}
              explanation={explanation}
              explaining={explaining}
              onExplainCode={handleExplainCode}
              alternative={alternative}
              alternating={alternating}
              onSuggestAlternative={handleSuggestAlternative}
              onJumpToLine={jumpToLine}
              hasActiveFile={Boolean(selectedPath && fileContent)}
              activeFilePath={selectedPath || undefined}
              isDiffMode={isDiffMode}
              onToggleDiffMode={() => setIsDiffMode(prev => !prev)}
              onFixIssue={handleFixIssue}
              onApplyAlternative={handleApplyAlternative}
              onRevertAlternative={handleRevertAlternative}
              isApplied={Boolean(originalFileContent && fileContent !== originalFileContent)}
            />
          </div>
        ) : (
          <div className="border-l border-[#E2E8F0] bg-white flex flex-col items-center py-3 px-1.5 z-10 shrink-0">
            <button
              onClick={() => setIsRightCollapsed(false)}
              className="p-1.5 rounded-[6px] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
              title="Expand inspector"
            >
              <PanelRightOpen size={16} />
            </button>
          </div>
        )}
      </div>

      {/* 4. Bottom Status Bar */}
      <footer className="h-7 border-t border-[#E2E8F0] bg-[#F8FAFC] px-4 flex justify-between items-center text-[11px] font-mono text-[#64748B] select-none shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Code2 size={12} className="text-[#2563EB]" />
            <span className="text-[#0F172A]">{selectedPath || 'No active file'}</span>
          </div>
          {lineCount > 0 && <span className="text-[#94A3B8]">{lineCount} lines</span>}
        </div>

        <div className="flex items-center gap-4">
          {isDiffMode && (
            <span className="bg-[#FEF3C7] text-[#D97706] font-semibold px-2 py-0.2 rounded border border-[#FDE68A] text-[10px]">
              DIFF VIEW ACTIVE
            </span>
          )}
          <span>UTF-8</span>
          <span>Spaces: 2</span>
          <span className="text-[#2563EB] font-medium">Code-Liner Engine v2.4</span>
        </div>
      </footer>
    </div>
  );
}

// Tree builder helper converting flat paths to hierarchical structure
function buildFileTree(files: { path: string }[]): FileNode[] {
  const root: FileNode[] = [];

  files.forEach(item => {
    const parts = item.path.split('/');
    let currentLevel = root;

    parts.forEach((part, index) => {
      const isLast = index === parts.length - 1;
      const type = isLast ? 'file' : 'directory';
      const pathAcc = parts.slice(0, index + 1).join('/');

      let existing = currentLevel.find(node => node.name === part);

      if (!existing) {
        existing = {
          name: part,
          path: pathAcc,
          type,
          ...(type === 'directory' && { children: [] }),
        };
        currentLevel.push(existing);
      }

      if (type === 'directory') {
        currentLevel = existing.children!;
      }
    });
  });

  const sortTree = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(n => {
      if (n.children) sortTree(n.children);
    });
  };

  sortTree(root);
  return root;
}

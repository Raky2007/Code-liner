import React from 'react';
import MonacoEditor, { DiffEditor } from '@monaco-editor/react';
import { FileCode2, Split, Code2, RefreshCw } from 'lucide-react';

interface CodeEditorPaneProps {
  selectedPath: string | null;
  fileContent: string;
  onMount: (editor: any) => void;
  diffCode?: string | null;
  isDiffMode?: boolean;
  onToggleDiffMode?: () => void;
}

const getMonacoLanguage = (filePath: string): string => {
  const ext = filePath.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'go':
      return 'go';
    case 'cpp':
    case 'hpp':
    case 'cc':
    case 'h':
    case 'c':
      return 'cpp';
    case 'json':
      return 'json';
    case 'md':
    case 'markdown':
      return 'markdown';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
    case 'scss':
    case 'less':
      return 'css';
    case 'sql':
      return 'sql';
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'shell';
    case 'yaml':
    case 'yml':
      return 'yaml';
    case 'xml':
    case 'svg':
      return 'xml';
    case 'toml':
    case 'ini':
      return 'ini';
    default:
      return 'plaintext';
  }
};

export const CodeEditorPane: React.FC<CodeEditorPaneProps> = ({
  selectedPath,
  fileContent,
  onMount,
  diffCode,
  isDiffMode = false,
  onToggleDiffMode,
}) => {
  if (!selectedPath) {
    return (
      <main className="flex-1 min-w-0 h-full flex flex-col items-center justify-center bg-[#F8FAFC] text-[#64748B] text-[13px] font-mono p-8 border-r border-[#E2E8F0]">
        <div className="w-12 h-12 rounded-[12px] bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center mb-3">
          <FileCode2 size={24} />
        </div>
        <p className="font-semibold text-[#0F172A]">No File Selected</p>
        <p className="text-[#64748B] text-[12px] mt-1">Select a file from the explorer tree or press Ctrl+K to search.</p>
      </main>
    );
  }

  const language = getMonacoLanguage(selectedPath);

  const handleEditorWillMount = (monaco: any) => {
    // Design System Spec #11: JetBrains Mono 14px, Line height 1.7, Background #0F172A, Text #E2E8F0
    monaco.editor.defineTheme('code-liner-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0F172A',
        'editor.foreground': '#E2E8F0',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#E2E8F0',
        'editor.selectionBackground': '#2563EB50',
        'editor.lineHighlightBackground': '#1E293B70',
        'editorCursor.foreground': '#38BDF8',
      },
    });
  };

  const handleEditorMount = (editor: any, monaco: any) => {
    monaco.editor.setTheme('code-liner-dark');
    onMount(editor);
  };

  return (
    <main className="flex-1 min-w-0 h-full flex flex-col border-r border-[#E2E8F0] bg-[#0F172A] overflow-hidden">
      {/* File Header Bar */}
      <div className="h-10 px-4 bg-white border-b border-[#E2E8F0] flex justify-between items-center text-[12px] font-mono text-[#475569] select-none shrink-0">
        <div className="flex items-center gap-2 truncate">
          <FileCode2 size={14} className="text-[#2563EB] shrink-0" />
          <span className="font-medium text-[#0F172A] truncate">{selectedPath}</span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Diff toggle button if alternative code is available */}
          {diffCode && onToggleDiffMode && (
            <button
              onClick={onToggleDiffMode}
              className={`flex items-center gap-1.5 text-[11px] font-mono font-medium px-2 py-0.5 rounded-[4px] border transition-colors ${
                isDiffMode
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-white text-[#0F172A] border-[#E2E8F0] hover:bg-[#F1F5F9]'
              }`}
            >
              {isDiffMode ? (
                <>
                  <Code2 size={12} />
                  <span>Standard View</span>
                </>
              ) : (
                <>
                  <Split size={12} className="text-[#D97706]" />
                  <span>View AI Diff</span>
                </>
              )}
            </button>
          )}

          <span className="text-[11px] font-mono font-medium bg-[#F1F5F9] border border-[#E2E8F0] px-2 py-0.5 rounded-[4px] text-[#475569]">
            {language}
          </span>
        </div>
      </div>

      {/* Monaco Container with dark editor background matching Spec #11 */}
      <div className="flex-1 w-full h-[calc(100%-40px)] min-h-0 relative bg-[#0F172A]">
        {isDiffMode && diffCode ? (
          <DiffEditor
            height="100%"
            width="100%"
            language={language}
            theme="code-liner-dark"
            original={fileContent}
            modified={diffCode}
            beforeMount={handleEditorWillMount}
            loading={
              <div className="flex items-center justify-center h-full text-[13px] font-mono text-[#64748B] gap-2">
                <RefreshCw size={14} className="animate-spin text-[#38BDF8]" />
                <span>Loading diff editor...</span>
              </div>
            }
            options={{
              readOnly: true,
              fontSize: 14,
              lineHeight: 24, // 14px * 1.7 approx
              fontFamily: 'JetBrains Mono, Menlo, monospace',
              lineNumbers: 'on',
              renderSideBySide: true,
              automaticLayout: true,
              scrollBeyondLastLine: false,
            }}
          />
        ) : (
          <MonacoEditor
            height="100%"
            width="100%"
            language={language}
            theme="code-liner-dark"
            value={fileContent}
            beforeMount={handleEditorWillMount}
            onMount={handleEditorMount}
            loading={
              <div className="flex items-center justify-center h-full text-[13px] font-mono text-[#64748B] gap-2">
                <RefreshCw size={14} className="animate-spin text-[#38BDF8]" />
                <span>Loading code editor...</span>
              </div>
            }
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              lineHeight: 24, // 14px * 1.7 approx
              fontFamily: 'JetBrains Mono, Menlo, monospace',
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              domReadOnly: true,
              renderLineHighlight: 'all',
            }}
          />
        )}
      </div>
    </main>
  );
};

export default CodeEditorPane;

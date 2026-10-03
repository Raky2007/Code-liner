import React, { useState, useMemo } from 'react';
import {
  Terminal,
  Code,
  Layers,
  Share2,
  KeyRound,
  Search,
  Flame,
} from 'lucide-react';
import { FileMetadata } from '../../types';

interface ASTEntitiesTabProps {
  activeFileMetadata?: FileMetadata;
  fileContent?: string;
  onJumpToLine: (line: number) => void;
}

export const ASTEntitiesTab: React.FC<ASTEntitiesTabProps> = ({
  activeFileMetadata,
  fileContent = '',
  onJumpToLine,
}) => {
  const [search, setSearch] = useState('');

  // Extract env/config variables directly from fileContent if not already present
  const resolvedVariables = useMemo(() => {
    const list: { name: string; line: number }[] = [];
    const lines = fileContent ? fileContent.split(/\r?\n/) : [];

    if (activeFileMetadata?.variables && activeFileMetadata.variables.length > 0) {
      activeFileMetadata.variables.forEach(varName => {
        const lineIdx = lines.findIndex(l => l.includes(varName));
        list.push({ name: varName, line: lineIdx !== -1 ? lineIdx + 1 : 1 });
      });
      return list;
    }

    // Heuristic extraction for .env or config files
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
          list.push({ name: key, line: idx + 1 });
        }
      }
    });

    return list;
  }, [activeFileMetadata?.variables, fileContent]);

  if (!activeFileMetadata && !fileContent) {
    return (
      <div className="text-center py-10 text-[12px] text-[#64748B] font-mono">
        Select a source file to inspect parsed AST entities.
      </div>
    );
  }

  const { imports = [], classes = [], functions = [], exports = [] } = activeFileMetadata || {};

  // Find line for exports/imports if missing
  const findLineForText = (text: string): number => {
    if (!fileContent) return 1;
    const lines = fileContent.split(/\r?\n/);
    const idx = lines.findIndex(l => l.includes(text));
    return idx !== -1 ? idx + 1 : 1;
  };

  const q = search.trim().toLowerCase();

  const filteredFunctions = functions.filter(f => !q || f.name.toLowerCase().includes(q));
  const filteredClasses = classes.filter(c => !q || c.name.toLowerCase().includes(q));
  const filteredVariables = resolvedVariables.filter(v => !q || v.name.toLowerCase().includes(q));
  const filteredExports = exports.filter(e => !q || e.name.toLowerCase().includes(q));
  const filteredImports = imports.filter(
    i => !q || i.name.toLowerCase().includes(q) || i.path.toLowerCase().includes(q)
  );

  const totalCount =
    functions.length + classes.length + resolvedVariables.length + exports.length + imports.length;

  return (
    <div className="space-y-4 select-none text-[#0F172A]">
      {/* Symbol Search Input */}
      <div className="relative">
        <Search
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]"
        />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${totalCount} AST symbols...`}
          className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-[6px] pl-8 pr-3 py-1.5 text-[11px] font-mono text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB] transition-colors"
        />
      </div>

      {/* 1. FUNCTIONS SECTION */}
      {filteredFunctions.length > 0 && (
        <section className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-mono font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
              <Code size={13} className="text-[#8B5CF6]" />
              <span>Functions ({filteredFunctions.length})</span>
            </h4>
          </div>
          <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
            {filteredFunctions.map((fn, i) => {
              const isHigh = fn.complexity > 10;
              return (
                <div
                  key={i}
                  onClick={() => onJumpToLine(fn.lineStart)}
                  className="border border-[#E2E8F0] hover:border-[#8B5CF6] hover:bg-[#FAF5FF] cursor-pointer p-2 rounded-[6px] bg-white flex justify-between items-center transition-colors group"
                >
                  <div className="truncate mr-2">
                    <span className="font-semibold text-[#0F172A] group-hover:text-[#7C3AED]">
                      {fn.name}()
                    </span>
                    <div className="text-[10px] text-[#64748B] flex items-center gap-1.5 mt-0.5">
                      <span>Complexity:</span>
                      <span
                        className={`font-bold flex items-center gap-0.5 ${
                          isHigh ? 'text-[#DC2626]' : 'text-[#16A34A]'
                        }`}
                      >
                        {isHigh && <Flame size={10} />}
                        {fn.complexity}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-1.5 py-0.5 rounded shrink-0">
                    L{fn.lineStart}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. CLASSES SECTION */}
      {filteredClasses.length > 0 && (
        <section className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-mono font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={13} className="text-[#10B981]" />
              <span>Classes ({filteredClasses.length})</span>
            </h4>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
            {filteredClasses.map((cls, i) => (
              <div
                key={i}
                onClick={() => onJumpToLine(cls.lineStart)}
                className="border border-[#E2E8F0] hover:border-[#10B981] hover:bg-[#F0FDF4] cursor-pointer p-2 rounded-[6px] bg-white space-y-1 transition-colors group"
              >
                <div className="flex justify-between items-center font-semibold text-[#0F172A]">
                  <span className="group-hover:text-[#059669]">class {cls.name}</span>
                  <span className="text-[10px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-1.5 py-0.5 rounded">
                    L{cls.lineStart}
                  </span>
                </div>
                {cls.methods && cls.methods.length > 0 && (
                  <div className="text-[10px] text-[#64748B] truncate">
                    Methods: {cls.methods.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 3. VARIABLES & ENVIRONMENT KEYS SECTION */}
      {filteredVariables.length > 0 && (
        <section className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-mono font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound size={13} className="text-[#D97706]" />
              <span>Variables & Keys ({filteredVariables.length})</span>
            </h4>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
            {filteredVariables.map((v, i) => (
              <div
                key={i}
                onClick={() => onJumpToLine(v.line)}
                className="border border-[#E2E8F0] hover:border-[#D97706] hover:bg-[#FFFBEB] cursor-pointer p-1.5 px-2 rounded-[6px] bg-white flex justify-between items-center transition-colors group"
              >
                <span className="font-semibold text-[#0F172A] group-hover:text-[#B45309] truncate mr-2">
                  {v.name}
                </span>
                <span className="text-[10px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-1.5 py-0.2 rounded shrink-0">
                  L{v.line}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. EXPORTS SECTION */}
      {filteredExports.length > 0 && (
        <section className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-mono font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
              <Share2 size={13} className="text-[#2563EB]" />
              <span>Exports ({filteredExports.length})</span>
            </h4>
          </div>
          <div className="max-h-44 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
            {filteredExports.map((exp, i) => {
              const line = findLineForText(exp.name);
              return (
                <div
                  key={i}
                  onClick={() => onJumpToLine(line)}
                  className="border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#EFF6FF] cursor-pointer p-1.5 px-2 rounded-[6px] bg-white flex justify-between items-center transition-colors group"
                >
                  <div className="truncate mr-2">
                    <span className="font-semibold text-[#0F172A] group-hover:text-[#1D4ED8]">
                      {exp.name}
                    </span>
                    {exp.type && (
                      <span className="ml-1.5 text-[9px] uppercase px-1 py-0.2 bg-[#F1F5F9] rounded text-[#64748B]">
                        {exp.type}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] px-1.5 py-0.2 rounded shrink-0">
                    L{line}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. IMPORTS SECTION */}
      {filteredImports.length > 0 && (
        <section className="space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-mono font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
              <Terminal size={13} className="text-[#0EA5E9]" />
              <span>Imports ({filteredImports.length})</span>
            </h4>
          </div>
          <div className="max-h-44 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
            {filteredImports.map((imp, i) => {
              const line = findLineForText(imp.name);
              return (
                <div
                  key={i}
                  onClick={() => onJumpToLine(line)}
                  className="border border-[#E2E8F0] hover:border-[#0EA5E9] hover:bg-[#F0F9FF] cursor-pointer p-1.5 px-2 rounded-[6px] bg-white flex justify-between items-center transition-colors group"
                >
                  <span className="font-semibold text-[#0F172A] truncate mr-2 group-hover:text-[#0284C7]">
                    {imp.name}
                  </span>
                  <span
                    className="text-[10px] text-[#64748B] truncate max-w-[120px]"
                    title={imp.path}
                  >
                    {imp.path}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {totalCount === 0 && (
        <div className="border border-[#E2E8F0] p-6 text-center rounded-[12px] bg-[#F8FAFC] text-[12px] text-[#64748B]">
          No AST symbols detected in this file.
        </div>
      )}
    </div>
  );
};

export default ASTEntitiesTab;

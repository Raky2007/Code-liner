import React from 'react';
import { Terminal, Code, Layers } from 'lucide-react';
import { FileMetadata } from '../../types';

interface ASTEntitiesTabProps {
  activeFileMetadata?: FileMetadata;
  onJumpToLine: (line: number) => void;
}

export const ASTEntitiesTab: React.FC<ASTEntitiesTabProps> = ({
  activeFileMetadata,
  onJumpToLine,
}) => {
  if (!activeFileMetadata) {
    return (
      <div className="text-center py-10 text-xs text-secondary-foreground font-mono">
        Select a source file to inspect parsed AST entities.
      </div>
    );
  }

  const { imports = [], classes = [], functions = [] } = activeFileMetadata;

  return (
    <div className="space-y-6">
      {/* 1. Imports Section with dedicated scroll viewport */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 select-none">
            <Terminal size={13} className="text-blue-500" />
            <span>Imports</span>
          </h4>
          <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-600 px-1.5 py-0.2 rounded">
            {imports.length}
          </span>
        </div>

        {imports.length === 0 ? (
          <p className="text-[11px] text-secondary-foreground italic bg-secondary/60 p-2.5 rounded-lg border border-border">
            No external module imports declared.
          </p>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
            {imports.map((imp, i) => (
              <div
                key={i}
                className="text-[11px] font-mono border border-border p-2 rounded-lg bg-secondary/50 flex items-center justify-between gap-2 hover:border-neutral-400 transition-colors"
              >
                <span className="truncate font-semibold text-foreground">{imp.name}</span>
                <span className="text-secondary-foreground text-[10px] truncate max-w-[130px]" title={imp.path}>
                  {imp.path}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. Classes Section with dedicated scroll viewport */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 select-none">
            <Layers size={13} className="text-emerald-500" />
            <span>Classes</span>
          </h4>
          <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-600 px-1.5 py-0.2 rounded">
            {classes.length}
          </span>
        </div>

        {classes.length === 0 ? (
          <p className="text-[11px] text-secondary-foreground italic bg-secondary/60 p-2.5 rounded-lg border border-border">
            No class definitions found.
          </p>
        ) : (
          <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
            {classes.map((cls, i) => (
              <div
                key={i}
                onClick={() => onJumpToLine(cls.lineStart)}
                className="text-[11px] font-mono border border-border hover:border-foreground cursor-pointer p-2.5 rounded-lg bg-secondary/50 space-y-1.5 transition-colors group"
              >
                <div className="flex justify-between items-center font-semibold text-foreground">
                  <span className="group-hover:text-blue-600 transition-colors">class {cls.name}</span>
                  <span className="text-[10px] text-neutral-400 bg-white px-1.5 py-0.5 rounded border border-border">
                    L{cls.lineStart}
                  </span>
                </div>
                {cls.methods && cls.methods.length > 0 && (
                  <div className="text-[10px] text-secondary-foreground">
                    <span className="text-neutral-400">Methods: </span>
                    {cls.methods.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Functions Section with dedicated scroll viewport */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 select-none">
            <Code size={13} className="text-purple-500" />
            <span>Functions</span>
          </h4>
          <span className="text-[10px] font-mono font-bold bg-neutral-100 text-neutral-600 px-1.5 py-0.2 rounded">
            {functions.length}
          </span>
        </div>

        {functions.length === 0 ? (
          <p className="text-[11px] text-secondary-foreground italic bg-secondary/60 p-2.5 rounded-lg border border-border">
            No function structures detected.
          </p>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
            {functions.map((fun, i) => {
              const isHighComplexity = fun.complexity > 10;
              return (
                <div
                  key={i}
                  onClick={() => onJumpToLine(fun.lineStart)}
                  className="text-[11px] font-mono border border-border hover:border-foreground cursor-pointer p-2.5 rounded-lg bg-secondary/50 flex justify-between items-center transition-colors group"
                >
                  <div>
                    <span className="font-semibold text-foreground group-hover:text-purple-600 transition-colors">
                      {fun.name}()
                    </span>
                    <div className="text-[10px] flex items-center gap-1.5 mt-0.5">
                      <span className="text-neutral-400">Complexity:</span>
                      <span
                        className={`font-semibold ${
                          isHighComplexity ? 'text-red-500' : 'text-neutral-600'
                        }`}
                      >
                        {fun.complexity}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-400 bg-white px-1.5 py-0.5 rounded border border-border">
                    L{fun.lineStart}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default ASTEntitiesTab;

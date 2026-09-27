export interface ParsedImport {
  name: string;
  path: string;
  isExternal: boolean;
}

export interface ParsedExport {
  name: string;
  type: 'function' | 'class' | 'variable' | 'unknown';
}

export interface ParsedFunction {
  name: string;
  lineStart: number;
  lineEnd: number;
  complexity: number;
}

export interface ParsedClass {
  name: string;
  lineStart: number;
  lineEnd: number;
  methods: string[];
}

export interface ParsedCall {
  name: string; // The function or method name being called
  callee: string; // The context (e.g. object name, module name, or 'self')
}

export interface ParsedFileResult {
  language: string;
  imports: ParsedImport[];
  exports: ParsedExport[];
  functions: ParsedFunction[];
  classes: ParsedClass[];
  variables: string[];
  calls: ParsedCall[];
  linesCount: number;
}

export abstract class LanguageAnalyzer {
  abstract language: string;
  abstract extensions: string[];
  abstract parse(code: string, filePath: string): Promise<ParsedFileResult>;
}

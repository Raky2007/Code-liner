import { LanguageAnalyzer, ParsedFileResult, ParsedImport, ParsedExport, ParsedFunction, ParsedClass, ParsedCall } from './analyzer.interface';

// Helper to determine if an import is external
function getIsExternal(sourcePath: string): boolean {
  return !sourcePath.startsWith('.') && !sourcePath.startsWith('/') && !sourcePath.startsWith('\\');
}

// Helper to clean import strings
function cleanImport(importStr: string): string {
  return importStr.replace(/['";\s]/g, '');
}

// --- PYTHON ANALYZER ---
export class PythonAnalyzer extends LanguageAnalyzer {
  language = 'python';
  extensions = ['.py'];

  async parse(code: string, filePath: string): Promise<ParsedFileResult> {
    const lines = code.split(/\r?\n/);
    const imports: ParsedImport[] = [];
    const exports: ParsedExport[] = [];
    const functions: ParsedFunction[] = [];
    const classes: ParsedClass[] = [];
    const variables: string[] = [];
    const calls: ParsedCall[] = [];

    let currentClass: { name: string; lineStart: number; indent: number; methods: string[] } | null = null;
    let currentFunc: { name: string; lineStart: number; indent: number; bodyLines: string[] } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      const trimmed = line.trim();
      const indent = line.length - line.trimStart().length;

      if (!trimmed || trimmed.startsWith('#')) continue;

      // Check block transitions by indent levels
      if (currentFunc && indent <= currentFunc.indent && trimmed.length > 0) {
        // Function ended. Calculate its complexity
        const complexity = calculatePythonFuncComplexity(currentFunc.bodyLines);
        functions.push({
          name: currentFunc.name,
          lineStart: currentFunc.lineStart,
          lineEnd: lineNum - 1,
          complexity,
        });
        currentFunc = null;
      }

      if (currentClass && indent <= currentClass.indent && trimmed.length > 0) {
        // Class ended
        classes.push({
          name: currentClass.name,
          lineStart: currentClass.lineStart,
          lineEnd: lineNum - 1,
          methods: currentClass.methods,
        });
        currentClass = null;
      }

      // --- 1. IMPORTS ---
      // Pattern: import foo, bar
      const importMatch = trimmed.match(/^import\s+(.+)$/);
      if (importMatch) {
        const parts = importMatch[1].split(',');
        parts.forEach(p => {
          const name = p.trim().split(/\s+as\s+/)[0];
          imports.push({ name, path: name, isExternal: getIsExternal(name) });
        });
      }

      // Pattern: from foo import bar
      const fromMatch = trimmed.match(/^from\s+([a-zA-Z0-9_\.]+)\s+import\s+(.+)$/);
      if (fromMatch) {
        const path = fromMatch[1];
        const names = fromMatch[2].split(',');
        names.forEach(n => {
          const name = n.trim().split(/\s+as\s+/)[0];
          imports.push({ name, path, isExternal: getIsExternal(path) });
        });
      }

      // --- 2. CLASSES ---
      // Pattern: class Foo(Bar):
      const classMatch = trimmed.match(/^class\s+([a-zA-Z0-9_]+)(?:\s*\(.*?\))?\s*:/);
      if (classMatch) {
        currentClass = {
          name: classMatch[1],
          lineStart: lineNum,
          indent,
          methods: [],
        };
        exports.push({ name: classMatch[1], type: 'class' });
        continue;
      }

      // --- 3. FUNCTIONS ---
      // Pattern: def foo(bar):
      const defMatch = trimmed.match(/^def\s+([a-zA-Z0-9_]+)\s*\((.*?)\)\s*(?:->.*?)?:/);
      if (defMatch) {
        const name = defMatch[1];
        currentFunc = {
          name,
          lineStart: lineNum,
          indent,
          bodyLines: [],
        };
        if (currentClass) {
          currentClass.methods.push(name);
        } else {
          exports.push({ name, type: 'function' });
        }
        continue;
      }

      // Collect function lines
      if (currentFunc) {
        currentFunc.bodyLines.push(trimmed);
      }

      // --- 4. VARIABLES ---
      // Pattern: foo = bar (exclude functions and local class scopes for simplicity, capture globals)
      if (indent === 0) {
        const varMatch = trimmed.match(/^([a-zA-Z0-9_]+)\s*=[^=]/);
        if (varMatch) {
          variables.push(varMatch[1]);
          exports.push({ name: varMatch[1], type: 'variable' });
        }
      }

      // --- 5. CALLS ---
      // Pattern: foo.bar(baz) or foo(baz)
      const callsMatch = [...trimmed.matchAll(/([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)?)\s*\(/g)];
      callsMatch.forEach(m => {
        const callExpr = m[1];
        if (callExpr.includes('.')) {
          const idx = callExpr.indexOf('.');
          calls.push({
            name: callExpr.substring(idx + 1),
            callee: callExpr.substring(0, idx),
          });
        } else {
          calls.push({
            name: callExpr,
            callee: '',
          });
        }
      });
    }

    // Flush active blocks at EOF
    if (currentFunc) {
      const complexity = calculatePythonFuncComplexity(currentFunc.bodyLines);
      functions.push({
        name: currentFunc.name,
        lineStart: currentFunc.lineStart,
        lineEnd: lines.length,
        complexity,
      });
    }
    if (currentClass) {
      classes.push({
        name: currentClass.name,
        lineStart: currentClass.lineStart,
        lineEnd: lines.length,
        methods: currentClass.methods,
      });
    }

    return {
      language: this.language,
      imports,
      exports,
      functions,
      classes,
      variables,
      calls,
      linesCount: lines.length,
    };
  }
}

function calculatePythonFuncComplexity(bodyLines: string[]): number {
  let complexity = 1;
  bodyLines.forEach(line => {
    // Search decision keywords
    if (line.match(/\b(if|elif|while|for|except)\b/)) complexity++;
    // Search logical operators
    const logicMatches = line.match(/\b(and|or)\b/g);
    if (logicMatches) {
      complexity += logicMatches.length;
    }
  });
  return complexity;
}

// --- JAVA ANALYZER ---
export class JavaAnalyzer extends LanguageAnalyzer {
  language = 'java';
  extensions = ['.java'];

  async parse(code: string, filePath: string): Promise<ParsedFileResult> {
    const lines = code.split(/\r?\n/);
    const imports: ParsedImport[] = [];
    const exports: ParsedExport[] = [];
    const functions: ParsedFunction[] = [];
    const classes: ParsedClass[] = [];
    const variables: string[] = [];
    const calls: ParsedCall[] = [];

    let braceCount = 0;
    let currentClass: { name: string; lineStart: number; braceDepth: number; methods: string[] } | null = null;
    let currentFunc: { name: string; lineStart: number; braceDepth: number; bodyLines: string[] } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;

      // Brace tracking
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;

      // Imports
      const importMatch = trimmed.match(/^import\s+([a-zA-Z0-9_\.]+);/);
      if (importMatch) {
        const path = importMatch[1];
        const parts = path.split('.');
        const name = parts[parts.length - 1];
        imports.push({ name, path, isExternal: getIsExternal(path) });
      }

      // Detect Class
      const classMatch = trimmed.match(/(?:public|protected|private|static|\s)*class\s+([a-zA-Z0-9_]+)/);
      if (classMatch && !currentClass) {
        currentClass = {
          name: classMatch[1],
          lineStart: lineNum,
          braceDepth: braceCount,
          methods: [],
        };
        exports.push({ name: classMatch[1], type: 'class' });
      }

      // Detect Method
      // e.g. public void test(String x) {
      const methodMatch = trimmed.match(/(?:public|protected|private|static|final|synchronized|\s)+([a-zA-Z0-9_<>]+)\s+([a-zA-Z0-9_]+)\s*\((.*?)\)(?:\s*throws\s+[a-zA-Z0-9_,\s]+)?\s*(?:{|;)?$/);
      if (methodMatch && currentClass && !currentFunc && !trimmed.includes('class') && !trimmed.includes('new ')) {
        const name = methodMatch[2];
        currentFunc = {
          name,
          lineStart: lineNum,
          braceDepth: braceCount,
          bodyLines: [],
        };
        currentClass.methods.push(name);
      }

      // Collect body lines
      if (currentFunc) {
        currentFunc.bodyLines.push(trimmed);
      }

      // Brace stack monitoring
      braceCount += openBraces - closeBraces;

      // Function termination checks
      if (currentFunc && braceCount <= currentFunc.braceDepth) {
        const complexity = calculateBraceLangComplexity(currentFunc.bodyLines);
        functions.push({
          name: currentFunc.name,
          lineStart: currentFunc.lineStart,
          lineEnd: lineNum,
          complexity,
        });
        currentFunc = null;
      }

      // Class termination checks
      if (currentClass && braceCount <= currentClass.braceDepth) {
        classes.push({
          name: currentClass.name,
          lineStart: currentClass.lineStart,
          lineEnd: lineNum,
          methods: currentClass.methods,
        });
        currentClass = null;
      }

      // Calls
      const callsMatch = [...trimmed.matchAll(/([a-zA-Z0-9_]+)\s*\(/g)];
      callsMatch.forEach(m => {
        const name = m[1];
        if (!['if', 'for', 'while', 'switch', 'catch', 'super', 'this'].includes(name)) {
          calls.push({ name, callee: '' });
        }
      });
    }

    return {
      language: this.language,
      imports,
      exports,
      functions,
      classes,
      variables,
      calls,
      linesCount: lines.length,
    };
  }
}

// --- GO ANALYZER ---
export class GoAnalyzer extends LanguageAnalyzer {
  language = 'go';
  extensions = ['.go'];

  async parse(code: string, filePath: string): Promise<ParsedFileResult> {
    const lines = code.split(/\r?\n/);
    const imports: ParsedImport[] = [];
    const exports: ParsedExport[] = [];
    const functions: ParsedFunction[] = [];
    const classes: ParsedClass[] = []; // maps to struct definitions
    const variables: string[] = [];
    const calls: ParsedCall[] = [];

    let braceCount = 0;
    let currentFunc: { name: string; lineStart: number; braceDepth: number; bodyLines: string[] } | null = null;
    let inImportBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;

      // Go Import statements
      if (trimmed === 'import (') {
        inImportBlock = true;
        continue;
      }
      if (inImportBlock && trimmed === ')') {
        inImportBlock = false;
        continue;
      }

      if (inImportBlock) {
        const path = cleanImport(trimmed);
        const name = path.split('/').pop() || path;
        imports.push({ name, path, isExternal: getIsExternal(path) });
      } else {
        const importMatch = trimmed.match(/^import\s+(.+)$/);
        if (importMatch) {
          const path = cleanImport(importMatch[1]);
          const name = path.split('/').pop() || path;
          imports.push({ name, path, isExternal: getIsExternal(path) });
        }
      }

      // Go Struct definition (representing classes in code structure)
      const structMatch = trimmed.match(/^type\s+([a-zA-Z0-9_]+)\s+struct/);
      if (structMatch) {
        classes.push({
          name: structMatch[1],
          lineStart: lineNum,
          lineEnd: lineNum + 2, // approximation
          methods: [],
        });
        exports.push({ name: structMatch[1], type: 'class' });
      }

      // Go Function declaration
      // e.g. func test() {
      // e.g. func (r *Repo) test() {
      const funcMatch = trimmed.match(/^func\s+(?:\(\s*[a-zA-Z0-9_*\s]+\s*\)\s*)?([a-zA-Z0-9_]+)\s*\((.*?)\)/);
      if (funcMatch && !currentFunc) {
        const name = funcMatch[1];
        currentFunc = {
          name,
          lineStart: lineNum,
          braceDepth: braceCount,
          bodyLines: [],
        };
        // If capitalize, export it
        if (name[0] === name[0].toUpperCase()) {
          exports.push({ name, type: 'function' });
        }
      }

      if (currentFunc) {
        currentFunc.bodyLines.push(trimmed);
      }

      braceCount += openBraces - closeBraces;

      if (currentFunc && braceCount <= currentFunc.braceDepth) {
        const complexity = calculateBraceLangComplexity(currentFunc.bodyLines);
        functions.push({
          name: currentFunc.name,
          lineStart: currentFunc.lineStart,
          lineEnd: lineNum,
          complexity,
        });
        currentFunc = null;
      }

      // Go calls
      const callsMatch = [...trimmed.matchAll(/([a-zA-Z0-9_]+)\s*\(/g)];
      callsMatch.forEach(m => {
        const name = m[1];
        if (!['if', 'for', 'switch', 'func', 'go', 'defer', 'select', 'chan', 'make'].includes(name)) {
          calls.push({ name, callee: '' });
        }
      });
    }

    return {
      language: this.language,
      imports,
      exports,
      functions,
      classes,
      variables,
      calls,
      linesCount: lines.length,
    };
  }
}

// --- C++ ANALYZER ---
export class CppAnalyzer extends LanguageAnalyzer {
  language = 'cpp';
  extensions = ['.cpp', '.h', '.hpp', '.cc', '.cxx', '.c'];

  async parse(code: string, filePath: string): Promise<ParsedFileResult> {
    const lines = code.split(/\r?\n/);
    const imports: ParsedImport[] = [];
    const exports: ParsedExport[] = [];
    const functions: ParsedFunction[] = [];
    const classes: ParsedClass[] = [];
    const variables: string[] = [];
    const calls: ParsedCall[] = [];

    let braceCount = 0;
    let currentClass: { name: string; lineStart: number; braceDepth: number; methods: string[] } | null = null;
    let currentFunc: { name: string; lineStart: number; braceDepth: number; bodyLines: string[] } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;

      // Imports (Includes)
      const includeMatch = trimmed.match(/^#include\s*[<"](.*?)[>"]/);
      if (includeMatch) {
        const path = includeMatch[1];
        const name = path.split('/').pop() || path;
        imports.push({ name, path, isExternal: getIsExternal(path) });
      }

      // Classes / Structs
      const classMatch = trimmed.match(/^(?:class|struct)\s+([a-zA-Z0-9_]+)/);
      if (classMatch && !currentClass) {
        currentClass = {
          name: classMatch[1],
          lineStart: lineNum,
          braceDepth: braceCount,
          methods: [],
        };
      }

      // Functions (heuristic approach)
      // e.g. int calculate(int a, int b) {
      const funcMatch = trimmed.match(/^(?:[a-zA-Z0-9_:<>&*]+\s+)+([a-zA-Z0-9_]+)\s*\((.*?)\)\s*(?:const)?\s*(?:{|;)?$/);
      if (funcMatch && !currentFunc && !trimmed.includes('class') && !trimmed.includes('struct') && !trimmed.includes('return ')) {
        const name = funcMatch[1];
        if (!['if', 'for', 'while', 'switch', 'catch'].includes(name)) {
          currentFunc = {
            name,
            lineStart: lineNum,
            braceDepth: braceCount,
            bodyLines: [],
          };
          if (currentClass) {
            currentClass.methods.push(name);
          }
        }
      }

      if (currentFunc) {
        currentFunc.bodyLines.push(trimmed);
      }

      braceCount += openBraces - closeBraces;

      if (currentFunc && braceCount <= currentFunc.braceDepth) {
        const complexity = calculateBraceLangComplexity(currentFunc.bodyLines);
        functions.push({
          name: currentFunc.name,
          lineStart: currentFunc.lineStart,
          lineEnd: lineNum,
          complexity,
        });
        currentFunc = null;
      }

      if (currentClass && braceCount <= currentClass.braceDepth) {
        classes.push({
          name: currentClass.name,
          lineStart: currentClass.lineStart,
          lineEnd: lineNum,
          methods: currentClass.methods,
        });
        currentClass = null;
      }

      // Calls
      const callsMatch = [...trimmed.matchAll(/([a-zA-Z0-9_]+)\s*\(/g)];
      callsMatch.forEach(m => {
        const name = m[1];
        if (!['if', 'for', 'while', 'switch', 'catch', 'sizeof', 'define', 'include'].includes(name)) {
          calls.push({ name, callee: '' });
        }
      });
    }

    return {
      language: this.language,
      imports,
      exports,
      functions,
      classes,
      variables,
      calls,
      linesCount: lines.length,
    };
  }
}

// Shared helper to parse brace-language complexity (Java, Go, C++)
function calculateBraceLangComplexity(bodyLines: string[]): number {
  let complexity = 1;
  bodyLines.forEach(line => {
    // Match structure keywords
    if (line.match(/\b(if|for|while|catch|case)\b/)) complexity++;
    // Match logical operators
    const logicMatches = line.match(/(&&|\|\|)/g);
    if (logicMatches) {
      complexity += logicMatches.length;
    }
  });
  return complexity;
}

// --- GENERIC TEXT / CONFIG / MARKUP ANALYZER ---
export class GenericTextAnalyzer extends LanguageAnalyzer {
  language = 'plaintext';
  extensions: string[] = [];

  async parse(code: string, filePath: string): Promise<ParsedFileResult> {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const fileName = filePath.split('/').pop()?.toLowerCase() || '';

    let detectedLang = 'plaintext';
    if (ext === 'json') detectedLang = 'json';
    else if (ext === 'md' || ext === 'markdown') detectedLang = 'markdown';
    else if (ext === 'html' || ext === 'htm') detectedLang = 'html';
    else if (ext === 'css' || ext === 'scss' || ext === 'less') detectedLang = 'css';
    else if (ext === 'yaml' || ext === 'yml') detectedLang = 'yaml';
    else if (ext === 'sql') detectedLang = 'sql';
    else if (ext === 'sh' || ext === 'bash' || ext === 'zsh') detectedLang = 'shell';
    else if (ext === 'xml' || ext === 'svg') detectedLang = 'xml';
    else if (ext === 'toml') detectedLang = 'toml';
    else if (ext === 'env' || fileName.startsWith('.env')) detectedLang = 'config';
    else if (fileName.includes('dockerfile')) detectedLang = 'dockerfile';

    const lines = code.split(/\r?\n/);

    return {
      language: detectedLang,
      imports: [],
      exports: [],
      functions: [],
      classes: [],
      variables: [],
      calls: [],
      linesCount: lines.length,
    };
  }
}


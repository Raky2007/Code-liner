import * as babelParser from '@babel/parser';
import traverse from '@babel/traverse';
import { LanguageAnalyzer, ParsedFileResult, ParsedImport, ParsedExport, ParsedFunction, ParsedClass, ParsedCall } from './analyzer.interface';

// Safe handling of babel-traverse default export quirks in CommonJS/TS execution
const traverseAST = (traverse as any).default || traverse;

export class JavaScriptAnalyzer extends LanguageAnalyzer {
  language = 'javascript';
  extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];

  async parse(code: string, filePath: string): Promise<ParsedFileResult> {
    const lines = code.split(/\r?\n/);
    const linesCount = lines.length;

    // Fast-path guard for minified, bundled or giant files (> 500KB or minified line density)
    const isMinified = filePath.includes('.min.') || (linesCount > 100 && code.length / linesCount > 400);
    if (isMinified || code.length > 500 * 1024) {
      return this.fastRegexParse(code, filePath, linesCount);
    }

    const imports: ParsedImport[] = [];
    const exports: ParsedExport[] = [];
    const functions: ParsedFunction[] = [];
    const classes: ParsedClass[] = [];
    const variables: string[] = [];
    const calls: ParsedCall[] = [];

    // Detect if TS/JSX plugins are needed based on file extension
    const plugins: babelParser.ParserPlugin[] = ['decorators-legacy', 'classProperties', 'objectRestSpread'];
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      plugins.push('typescript');
    }
    if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
      plugins.push('jsx');
    }

    try {
      const ast = babelParser.parse(code, {
        sourceType: 'module',
        plugins,
        errorRecovery: true, // recover from syntax errors so pipeline doesn't crash on bad files
      });

      traverseAST(ast, {
        // --- 1. DETECT IMPORTS ---
        ImportDeclaration(pathNode: any) {
          const source = pathNode.node.source.value;
          const isExternal = !source.startsWith('.') && !source.startsWith('/');
          pathNode.node.specifiers.forEach((spec: any) => {
            imports.push({
              name: spec.local.name,
              path: source,
              isExternal,
            });
          });
        },

        CallExpression(pathNode: any) {
          // Detect require()
          if (
            pathNode.node.callee.type === 'Identifier' &&
            pathNode.node.callee.name === 'require' &&
            pathNode.node.arguments.length > 0 &&
            pathNode.node.arguments[0].type === 'StringLiteral'
          ) {
            const source = pathNode.node.arguments[0].value;
            const isExternal = !source.startsWith('.') && !source.startsWith('/');
            imports.push({
              name: 'require',
              path: source,
              isExternal,
            });
          }

          // --- 5. DETECT CALLS ---
          const callee = pathNode.node.callee;
          if (callee.type === 'Identifier') {
            calls.push({
              name: callee.name,
              callee: '',
            });
          } else if (callee.type === 'MemberExpression') {
            let calleeName = '';
            if (callee.object.type === 'Identifier') {
              calleeName = callee.object.name;
            } else if (callee.object.type === 'ThisExpression') {
              calleeName = 'this';
            }
            if (callee.property.type === 'Identifier') {
              calls.push({
                name: callee.property.name,
                callee: calleeName,
              });
            }
          }
        },

        // --- 2. DETECT EXPORTS ---
        ExportNamedDeclaration(pathNode: any) {
          if (pathNode.node.declaration) {
            const decl = pathNode.node.declaration;
            if (decl.type === 'FunctionDeclaration' && decl.id) {
              exports.push({ name: decl.id.name, type: 'function' });
            } else if (decl.type === 'ClassDeclaration' && decl.id) {
              exports.push({ name: decl.id.name, type: 'class' });
            } else if (decl.type === 'VariableDeclaration') {
              decl.declarations.forEach((d: any) => {
                if (d.id.type === 'Identifier') {
                  exports.push({ name: d.id.name, type: 'variable' });
                }
              });
            }
          }
          if (pathNode.node.specifiers) {
            pathNode.node.specifiers.forEach((spec: any) => {
              exports.push({
                name: spec.exported.name || 'unknown',
                type: 'unknown',
              });
            });
          }
        },

        ExportDefaultDeclaration(pathNode: any) {
          const decl = pathNode.node.declaration;
          let name = 'default';
          let type: 'function' | 'class' | 'variable' | 'unknown' = 'unknown';
          
          if (decl.type === 'Identifier') {
            name = decl.name;
          } else if (decl.type === 'FunctionDeclaration') {
            name = decl.id ? decl.id.name : 'default';
            type = 'function';
          } else if (decl.type === 'ClassDeclaration') {
            name = decl.id ? decl.id.name : 'default';
            type = 'class';
          }
          
          exports.push({ name, type });
        },

        AssignmentExpression(pathNode: any) {
          // Detect module.exports or exports.XYZ
          const left = pathNode.node.left;
          if (
            left.type === 'MemberExpression' &&
            left.object.type === 'Identifier' &&
            (left.object.name === 'module' || left.object.name === 'exports')
          ) {
            if (left.property.type === 'Identifier') {
              exports.push({ name: left.property.name, type: 'variable' });
            }
          }
        },

        // --- 3. DETECT CLASSES ---
        ClassDeclaration(pathNode: any) {
          const node = pathNode.node;
          const className = node.id ? node.id.name : 'AnonymousClass';
          const lineStart = node.loc ? node.loc.start.line : 1;
          const lineEnd = node.loc ? node.loc.end.line : 1;
          
          const methods: string[] = [];
          if (node.body && node.body.body) {
            node.body.body.forEach((member: any) => {
              if (member.type === 'ClassMethod' && member.key.type === 'Identifier') {
                methods.push(member.key.name);
              }
            });
          }

          classes.push({
            name: className,
            lineStart,
            lineEnd,
            methods,
          });
        },

        // --- 4. DETECT VARIABLES ---
        VariableDeclarator(pathNode: any) {
          if (pathNode.node.id.type === 'Identifier') {
            variables.push(pathNode.node.id.name);
          }
        },

        // --- 6. DETECT FUNCTIONS & MEASURE COMPLEXITY ---
        FunctionDeclaration(pathNode: any) {
          const node = pathNode.node;
          const funcName = node.id ? node.id.name : 'anonymous';
          const lineStart = node.loc ? node.loc.start.line : 1;
          const lineEnd = node.loc ? node.loc.end.line : 1;
          const complexity = calculateComplexity(pathNode);

          functions.push({
            name: funcName,
            lineStart,
            lineEnd,
            complexity,
          });
        },

        FunctionExpression(pathNode: any) {
          const node = pathNode.node;
          let funcName = node.id ? node.id.name : '';
          
          if (!funcName && pathNode.parent.type === 'VariableDeclarator' && pathNode.parent.id.type === 'Identifier') {
            funcName = pathNode.parent.id.name;
          }

          if (funcName) {
            const lineStart = node.loc ? node.loc.start.line : 1;
            const lineEnd = node.loc ? node.loc.end.line : 1;
            const complexity = calculateComplexity(pathNode);

            functions.push({
              name: funcName,
              lineStart,
              lineEnd,
              complexity,
            });
          }
        },

        ArrowFunctionExpression(pathNode: any) {
          let funcName = '';
          if (pathNode.parent.type === 'VariableDeclarator' && pathNode.parent.id.type === 'Identifier') {
            funcName = pathNode.parent.id.name;
          }

          if (funcName) {
            const node = pathNode.node;
            const lineStart = node.loc ? node.loc.start.line : 1;
            const lineEnd = node.loc ? node.loc.end.line : 1;
            const complexity = calculateComplexity(pathNode);

            functions.push({
              name: funcName,
              lineStart,
              lineEnd,
              complexity,
            });
          }
        },

        ClassMethod(pathNode: any) {
          const node = pathNode.node;
          if (node.key.type === 'Identifier') {
            const funcName = node.key.name;
            const lineStart = node.loc ? node.loc.start.line : 1;
            const lineEnd = node.loc ? node.loc.end.line : 1;
            const complexity = calculateComplexity(pathNode);

            functions.push({
              name: funcName,
              lineStart,
              lineEnd,
              complexity,
            });
          }
        },
      });

    } catch (err: any) {
      // If Babel fails, fall back to fast regex extraction
      return this.fastRegexParse(code, filePath, linesCount);
    }

    return {
      language: filePath.endsWith('.ts') || filePath.endsWith('.tsx') ? 'typescript' : 'javascript',
      imports,
      exports,
      functions,
      classes,
      variables,
      calls,
      linesCount,
    };
  }

  // Ultra-fast regex parsing fallback for minified or massive files
  private fastRegexParse(code: string, filePath: string, linesCount: number): ParsedFileResult {
    const imports: ParsedImport[] = [];
    const exports: ParsedExport[] = [];
    const functions: ParsedFunction[] = [];
    const classes: ParsedClass[] = [];

    // Match imports: import ... from '...' or require('...')
    const importRegex = /(?:import\s+(?:[\w\s{},*]+)\s+from\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
      const src = match[1] || match[2];
      if (src) {
        const isExternal = !src.startsWith('.') && !src.startsWith('/');
        imports.push({ name: src.split('/').pop() || src, path: src, isExternal });
      }
    }

    // Match export function/class/const
    const exportRegex = /export\s+(?:default\s+)?(?:async\s+)?(function|class|const|let|var)\s+([a-zA-Z0-9_$]+)/g;
    while ((match = exportRegex.exec(code)) !== null) {
      exports.push({ name: match[2], type: match[1] === 'function' ? 'function' : match[1] === 'class' ? 'class' : 'variable' });
    }

    // Match function declarations
    const funcRegex = /(?:function\s+([a-zA-Z0-9_$]+)|const\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>)/g;
    let funcCount = 0;
    while ((match = funcRegex.exec(code)) !== null && funcCount < 50) {
      const name = match[1] || match[2];
      if (name) {
        functions.push({ name, lineStart: 1, lineEnd: 1, complexity: 1 });
        funcCount++;
      }
    }

    return {
      language: filePath.endsWith('.ts') || filePath.endsWith('.tsx') ? 'typescript' : 'javascript',
      imports,
      exports,
      functions,
      classes,
      variables: [],
      calls: [],
      linesCount,
    };
  }
}

// Ultra-fast non-allocating AST recursive walk to compute cyclomatic complexity
function calculateNodeComplexity(node: any): number {
  if (!node || typeof node !== 'object') return 0;
  let count = 0;
  const type = node.type;

  if (
    type === 'IfStatement' ||
    type === 'ForStatement' ||
    type === 'ForInStatement' ||
    type === 'ForOfStatement' ||
    type === 'WhileStatement' ||
    type === 'DoWhileStatement' ||
    type === 'ConditionalExpression' ||
    type === 'CatchClause' ||
    (type === 'SwitchCase' && node.test) ||
    (type === 'LogicalExpression' && (node.operator === '&&' || node.operator === '||' || node.operator === '??'))
  ) {
    count++;
  }

  // Recurse into child properties without entering nested functions
  for (const key of Object.keys(node)) {
    if (key === 'loc' || key === 'comments' || key === 'leadingComments' || key === 'trailingComments') continue;
    const child = node[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item === 'object') {
          if (item.type !== 'FunctionDeclaration' && item.type !== 'FunctionExpression' && item.type !== 'ArrowFunctionExpression') {
            count += calculateNodeComplexity(item);
          }
        }
      }
    } else if (child && typeof child === 'object') {
      if (child.type !== 'FunctionDeclaration' && child.type !== 'FunctionExpression' && child.type !== 'ArrowFunctionExpression') {
        count += calculateNodeComplexity(child);
      }
    }
  }

  return count;
}

function calculateComplexity(functionPath: any): number {
  const node = functionPath.node;
  return 1 + calculateNodeComplexity(node.body);
}

import { ParsedFileResult } from '../parsing/parsing.service';
import { IssueSeverity } from '../projects/models';

export interface StaticIssueInput {
  type: 'complexity' | 'security' | 'quality';
  severity: IssueSeverity;
  line: number;
  function?: string;
  message: string;
  metric?: { name: string; value: number };
}

export class AnalysisService {
  analyzeFile(relativePath: string, code: string, parsed: ParsedFileResult): StaticIssueInput[] {
    const issues: StaticIssueInput[] = [];
    const lines = code.split(/\r?\n/);

    // 1. Complexity & Large Function Checks
    parsed.functions.forEach(func => {
      const functionLength = func.lineEnd - func.lineStart + 1;

      // Cyclomatic Complexity
      if (func.complexity > 25) {
        issues.push({
          type: 'complexity',
          severity: 'critical',
          line: func.lineStart,
          function: func.name,
          message: `Function "${func.name}" has extremely high cyclomatic complexity (${func.complexity}). Refactoring is highly recommended.`,
          metric: { name: 'cyclomatic_complexity', value: func.complexity },
        });
      } else if (func.complexity > 15) {
        issues.push({
          type: 'complexity',
          severity: 'high',
          line: func.lineStart,
          function: func.name,
          message: `Function "${func.name}" has high cyclomatic complexity (${func.complexity}). Consider breaking it down.`,
          metric: { name: 'cyclomatic_complexity', value: func.complexity },
        });
      } else if (func.complexity > 8) {
        issues.push({
          type: 'complexity',
          severity: 'medium',
          line: func.lineStart,
          function: func.name,
          message: `Function "${func.name}" has moderate cyclomatic complexity (${func.complexity}).`,
          metric: { name: 'cyclomatic_complexity', value: func.complexity },
        });
      }

      // Large Function length
      if (functionLength > 100) {
        issues.push({
          type: 'quality',
          severity: 'medium',
          line: func.lineStart,
          function: func.name,
          message: `Large function "${func.name}" spans ${functionLength} lines. Keep functions focused (under 50 lines).`,
          metric: { name: 'function_lines', value: functionLength },
        });
      } else if (functionLength > 50) {
        issues.push({
          type: 'quality',
          severity: 'low',
          line: func.lineStart,
          function: func.name,
          message: `Function "${func.name}" spans ${functionLength} lines. Consider refactoring.`,
          metric: { name: 'function_lines', value: functionLength },
        });
      }
    });

    // 2. Large Class Checks
    parsed.classes.forEach(cls => {
      const classLength = cls.lineEnd - cls.lineStart + 1;
      if (classLength > 200) {
        issues.push({
          type: 'quality',
          severity: 'medium',
          line: cls.lineStart,
          message: `Class "${cls.name}" is too large (${classLength} lines). Consider splitting responsibilities.`,
          metric: { name: 'class_lines', value: classLength },
        });
      } else if (classLength > 100) {
        issues.push({
          type: 'quality',
          severity: 'low',
          line: cls.lineStart,
          message: `Class "${cls.name}" spans ${classLength} lines. Keep classes modular.`,
          metric: { name: 'class_lines', value: classLength },
        });
      }
    });

    // 3. Security Audits (eval, hardcoded API keys, regex secrets scan)
    const secretRegexes = [
      { name: 'Generic API Key', regex: /api[_\-]?key\s*=\s*['"`]([a-zA-Z0-9_\-]{16,})['"`]/i },
      { name: 'Password Variable', regex: /password\s*=\s*['"`]([^'"`\s]{6,})['"`]/i },
      { name: 'Secret Key', regex: /secret[_\-]?key\s*=\s*['"`]([a-zA-Z0-9_\-]{16,})['"`]/i },
      { name: 'Bearer Token', regex: /token\s*=\s*['"`](ey[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+\.[a-zA-Z0-9_\-]+)['"`]/i },
      { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
    ];

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Unsafe Eval in JS/TS
      if ((parsed.language === 'javascript' || parsed.language === 'typescript') && line.includes('eval(')) {
        issues.push({
          type: 'security',
          severity: 'critical',
          line: lineNum,
          message: 'Use of unsafe "eval()" function detected. This can lead to remote code execution.',
        });
      }

      // Unsafe eval in Python
      if (parsed.language === 'python' && line.includes('eval(')) {
        issues.push({
          type: 'security',
          severity: 'critical',
          line: lineNum,
          message: 'Use of unsafe "eval()" or "exec()" function detected in Python.',
        });
      }

      // Hardcoded Secrets
      secretRegexes.forEach(sec => {
        const match = line.match(sec.regex);
        if (match) {
          // Verify we aren't matching an environment variable placeholder like process.env.API_KEY
          const matchedVal = match[1] || match[0];
          if (!matchedVal.includes('process.env') && !matchedVal.includes('os.environ') && !matchedVal.includes('ENV[')) {
            issues.push({
              type: 'security',
              severity: 'high',
              line: lineNum,
              message: `Possible hardcoded secret (${sec.name}) detected in code.`,
            });
          }
        }
      });

      // SQL Injection patterns (simplistic heuristic check)
      if (
        line.match(/SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\s*(\+|\$\{)/i) ||
        line.match(/execute\s*\(\s*['"`]\s*SELECT\s+.*\s+WHERE\s+.*%\s*/i)
      ) {
        issues.push({
          type: 'security',
          severity: 'high',
          line: lineNum,
          message: 'Potential SQL injection risk: query constructed using raw string concatenation or interpolation.',
        });
      }
    });

    // 4. Quality checks - Unused imports (basic heuristic)
    parsed.imports.forEach(imp => {
      if (imp.name && imp.name !== 'require' && imp.name !== 'default') {
        const escapedName = imp.name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escapedName}\\b`, 'g');
        const matches = code.match(regex);
        // If it only occurs once, it's just the import statement itself
        if (matches && matches.length === 1) {
          // Let's find where the import statement is
          let lineNum = 1;
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(imp.name)) {
              lineNum = i + 1;
              break;
            }
          }
          issues.push({
            type: 'quality',
            severity: 'low',
            line: lineNum,
            message: `Unused import "${imp.name}" detected. Importing unused modules clutters namespace.`,
          });
        }
      }
    });

    return issues;
  }
}

export const analysisService = new AnalysisService();

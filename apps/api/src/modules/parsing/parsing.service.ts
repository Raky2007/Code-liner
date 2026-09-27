import path from 'path';
import { LanguageAnalyzer, ParsedFileResult } from './analyzer.interface';
import { JavaScriptAnalyzer } from './js-analyzer';
import { PythonAnalyzer, JavaAnalyzer, GoAnalyzer, CppAnalyzer, GenericTextAnalyzer } from './generic-analyzers';

class ParsingService {
  private analyzers: LanguageAnalyzer[] = [];
  private genericAnalyzer: LanguageAnalyzer;

  constructor() {
    this.analyzers.push(new JavaScriptAnalyzer());
    this.analyzers.push(new PythonAnalyzer());
    this.analyzers.push(new JavaAnalyzer());
    this.analyzers.push(new GoAnalyzer());
    this.analyzers.push(new CppAnalyzer());
    this.genericAnalyzer = new GenericTextAnalyzer();
  }

  getAnalyzerForFile(filePath: string): LanguageAnalyzer {
    const ext = path.extname(filePath).toLowerCase();
    for (const analyzer of this.analyzers) {
      if (analyzer.extensions.includes(ext)) {
        return analyzer;
      }
    }
    return this.genericAnalyzer;
  }

  getGenericAnalyzer(): LanguageAnalyzer {
    return this.genericAnalyzer;
  }

  isSupportedFile(_filePath: string): boolean {
    return true; // Support all non-binary files
  }

  async parseFile(filePath: string, code: string): Promise<ParsedFileResult> {
    const analyzer = this.getAnalyzerForFile(filePath);
    return analyzer.parse(code, filePath);
  }
}

export const parsingService = new ParsingService();
export { ParsedFileResult };

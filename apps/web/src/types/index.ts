export type Archetype = 
  | 'frontend' 
  | 'router' 
  | 'controller' 
  | 'service' 
  | 'model' 
  | 'utility' 
  | 'unknown';

export interface FileMetadata {
  _id: string;
  path: string;
  language: string;
  classes: ClassEntity[];
  functions: FunctionEntity[];
  imports: ImportEntity[];
  exports: ExportEntity[];
  variables?: string[];
}

export interface ClassEntity {
  name: string;
  lineStart: number;
  lineEnd?: number;
  methods: string[];
}

export interface FunctionEntity {
  name: string;
  lineStart: number;
  lineEnd?: number;
  complexity: number;
}

export interface ImportEntity {
  name: string;
  path: string;
}

export interface ExportEntity {
  name: string;
  type?: string;
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export interface CodeIssue {
  _id: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | string;
  file: string;
  line: number;
  message: string;
  metric?: { name: string; value: number };
}

export interface AIExplanation {
  shortDescription: string;
  logicSteps?: string[];
  lineByLine?: Array<{
    line: number;
    explanation: string;
  }>;
}

export interface AIOptimization {
  complexityOriginal: string;
  complexityAlternative: string;
  tradeoffs: string;
  explanation: string;
  alternativeCode: string;
  keyChanges?: string[];
  resolvedIssues?: string[];
}

export interface ArchitectureGraphData {
  nodes: Array<{
    id: string;
    label: string;
    path: string;
    archetype: Archetype;
    language: string;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  referencedFiles?: string[];
}

export interface DocumentationEndpoint {
  method: string;
  path: string;
  handler: string;
  purpose?: string;
  sourceFile: string;
}

export interface DocumentationKeyModule {
  path: string;
  name: string;
  responsibility: string;
  functionsCount: number;
  classesCount: number;
  importantSymbols: string[];
  relationships: string[];
}

export interface DocumentationStep {
  step: number;
  title: string;
  description: string;
}

export interface DocumentationTechStack {
  languages: string[];
  frameworks: string[];
  buildTools: string[];
  databases: string[];
}

export interface DocumentationArchitectureLayer {
  name: string;
  description: string;
  evidence: string;
  modules: string[];
}

export interface DocumentationData {
  overview: {
    projectName: string;
    purpose: string;
    primaryLanguage: string;
    mainFramework: string;
    totalFiles: number;
    totalLines: number;
    codeHealthScore: number | null;
    totalIssues: number;
  };
  techStack: DocumentationTechStack;
  structure: {
    rootName: string;
    treeText: string;
    topDirectories: Array<{ path: string; count: number; purpose: string }>;
  };
  architecture: {
    patternName: string;
    description: string;
    layers: DocumentationArchitectureLayer[];
  };
  keyModules: DocumentationKeyModule[];
  dependencies: {
    directCount: number;
    devCount: number;
    highlights: Array<{ name: string; version: string; purpose: string }>;
    all: Array<{ name: string; version: string; type: 'direct' | 'dev' }>;
  };
  endpoints: {
    detected: boolean;
    list: DocumentationEndpoint[];
    notice?: string;
  };
  workflow: DocumentationStep[];
  codeHealth: {
    score: number | null;
    status: string;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    topRisks: Array<{
      title: string;
      severity: string;
      file: string;
      line: number;
      description: string;
    }>;
  };
  recommendedImprovements: Array<{
    problem: string;
    action: string;
    file: string;
    line: number;
    impact: 'High' | 'Medium' | 'Low';
    effort: 'Low' | 'Medium' | 'High';
    scoreGain?: number;
  }>;
}


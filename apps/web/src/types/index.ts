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

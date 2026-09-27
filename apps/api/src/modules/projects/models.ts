import mongoose, { Schema, Document } from 'mongoose';

// --- USER INTERFACE & SCHEMA ---
export interface IUser extends Document {
  email: string;
  passwordHash: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model<IUser>('User', UserSchema);

// --- PROJECT INTERFACE & SCHEMA ---
export type ProjectStatus =
  | 'UPLOADING'
  | 'VALIDATING'
  | 'EXTRACTING'
  | 'SCANNING'
  | 'DETECTING'
  | 'PARSING'
  | 'ANALYZING'
  | 'BUILDING_GRAPH'
  | 'COMPLETED'
  | 'FAILED';

export interface IDependency {
  name: string;
  version: string;
  type: 'direct' | 'dev';
}

export interface IProjectStats {
  totalFiles: number;
  totalLines: number;
  totalFunctions: number;
  totalClasses: number;
  totalIssues: number;
}

export interface IProject extends Document {
  name: string;
  description?: string;
  userId: mongoose.Types.ObjectId;
  status: ProjectStatus;
  error?: string;
  languages: string[];
  frameworks: string[];
  dependencies: IDependency[];
  stats: IProjectStats;
  createdAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: {
    type: String,
    required: true,
    enum: [
      'UPLOADING',
      'VALIDATING',
      'EXTRACTING',
      'SCANNING',
      'DETECTING',
      'PARSING',
      'ANALYZING',
      'BUILDING_GRAPH',
      'COMPLETED',
      'FAILED',
    ],
    default: 'UPLOADING',
  },
  error: { type: String },
  languages: [{ type: String }],
  frameworks: [{ type: String }],
  dependencies: [
    {
      name: { type: String, required: true },
      version: { type: String, required: true },
      type: { type: String, enum: ['direct', 'dev'], required: true },
    },
  ],
  stats: {
    totalFiles: { type: Number, default: 0 },
    totalLines: { type: Number, default: 0 },
    totalFunctions: { type: Number, default: 0 },
    totalClasses: { type: Number, default: 0 },
    totalIssues: { type: Number, default: 0 },
  },
  createdAt: { type: Date, default: Date.now },
});

export const Project = mongoose.model<IProject>('Project', ProjectSchema);

// --- FILE INTERFACE & SCHEMA ---
export interface IFileImport {
  name: string;
  path: string;
  isExternal: boolean;
}

export interface IFileExport {
  name: string;
  type: 'function' | 'class' | 'variable' | 'unknown';
}

export interface IFileFunction {
  name: string;
  lineStart: number;
  lineEnd: number;
  complexity: number;
}

export interface IFileClass {
  name: string;
  lineStart: number;
  lineEnd: number;
  methods: string[];
}

export interface IFileCall {
  name: string;
  callee: string;
}

export interface IFile extends Document {
  projectId: mongoose.Types.ObjectId;
  path: string;
  language: string;
  imports: IFileImport[];
  exports: IFileExport[];
  functions: IFileFunction[];
  classes: IFileClass[];
  variables: string[];
  calls: IFileCall[];
  createdAt: Date;
}

const FileSchema = new Schema<IFile>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
  path: { type: String, required: true, trim: true },
  language: { type: String, required: true },
  imports: [
    {
      name: { type: String, required: true },
      path: { type: String, required: true },
      isExternal: { type: Boolean, required: true },
    },
  ],
  exports: [
    {
      name: { type: String, required: true },
      type: { type: String, enum: ['function', 'class', 'variable', 'unknown'], required: true },
    },
  ],
  functions: [
    {
      name: { type: String, required: true },
      lineStart: { type: Number, required: true },
      lineEnd: { type: Number, required: true },
      complexity: { type: Number, required: true },
    },
  ],
  classes: [
    {
      name: { type: String, required: true },
      lineStart: { type: Number, required: true },
      lineEnd: { type: Number, required: true },
      methods: [{ type: String }],
    },
  ],
  variables: [{ type: String }],
  calls: [
    {
      name: { type: String, required: true },
      callee: { type: String, default: '' },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

// Compound index to guarantee uniqueness of paths within a project, and fast retrieval
FileSchema.index({ projectId: 1, path: 1 }, { unique: true });

export const File = mongoose.model<IFile>('File', FileSchema);

// --- ISSUE INTERFACE & SCHEMA ---
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface IIssueMetric {
  name: string;
  value: number;
}

export interface IIssue extends Document {
  projectId: mongoose.Types.ObjectId;
  type: 'complexity' | 'security' | 'quality';
  severity: IssueSeverity;
  file: string;
  line: number;
  function?: string;
  message: string;
  metric?: IIssueMetric;
  createdAt: Date;
}

const IssueSchema = new Schema<IIssue>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  type: { type: String, required: true, enum: ['complexity', 'security', 'quality'] },
  severity: { type: String, required: true, enum: ['low', 'medium', 'high', 'critical'] },
  file: { type: String, required: true, trim: true, index: true },
  line: { type: Number, required: true },
  function: { type: String },
  message: { type: String, required: true },
  metric: {
    name: { type: String },
    value: { type: Number },
  },
  createdAt: { type: Date, default: Date.now },
});

export const Issue = mongoose.model<IIssue>('Issue', IssueSchema);

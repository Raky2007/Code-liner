import { Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { Project, File, Issue } from './models';
import { ingestionService } from '../ingestion/ingestion.service';
import { architectureService } from '../architecture/architecture.service';
import { reportsService } from '../reports/reports.service';
import { aiService } from '../ai/ai.service';
import { AuthenticatedRequest } from '../../middleware/auth';
import { config } from '../../config';

export async function createProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Project name is required.' });
    }

    const project = await Project.create({
      name,
      description,
      userId: req.user!.id,
      status: 'UPLOADING',
    });

    return res.status(201).json(project);
  } catch (err) {
    next(err);
  }
}

export async function listProjects(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> {
  try {
    const projects = await Project.find({ userId: req.user!.id }).sort({ createdAt: -1 });
    return res.status(200).json(projects);
  } catch (err) {
    next(err);
  }
}

export async function getProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    return res.status(200).json(project);
  } catch (err) {
    next(err);
  }
}

export async function deleteProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> {
  try {
    const projectId = req.params.id;
    const project = await Project.findOneAndDelete({ _id: projectId, userId: req.user!.id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Delete database records
    await File.deleteMany({ projectId });
    await Issue.deleteMany({ projectId });

    // Clean up files on disk
    const projectDir = path.join(config.uploadDir, projectId);
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }

    return res.status(200).json({ message: 'Project deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function uploadProjectZip(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> {
  try {
    const projectId = req.params.id;
    const project = await Project.findOne({ _id: projectId, userId: req.user!.id });

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No ZIP file uploaded.' });
    }

    // Update status to VALIDATING and respond 202 immediately to run pipeline in background
    project.status = 'VALIDATING';
    await project.save();

    // Trigger Ingestion Pipeline asynchronously
    ingestionService.ingestProject(projectId, req.file.path).catch(err => {
      console.error(`Ingestion Pipeline Background Error for project ${projectId}:`, err);
    });

    return res.status(202).json({
      message: 'Upload received. Ingestion pipeline started in background.',
      projectId,
      status: 'VALIDATING',
    });
  } catch (err) {
    next(err);
  }
}

export async function getProjectStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }
    return res.status(200).json({
      status: project.status,
      error: project.error,
    });
  } catch (err) {
    next(err);
  }
}

export async function getProjectFiles(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> {
  try {
    const projectId = req.params.id;
    const project = await Project.findOne({ _id: projectId, userId: req.user!.id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const files = await File.find({ projectId }).select('path language classes functions imports exports');
    return res.status(200).json(files);
  } catch (err) {
    next(err);
  }
}

export async function getFileContent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> {
  try {
    const projectId = req.params.id;
    const project = await Project.findOne({ _id: projectId, userId: req.user!.id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const requestedPath = req.query.path as string;
    if (!requestedPath) {
      return res.status(400).json({ message: 'File path query parameter (?path=...) is required.' });
    }

    const projectDir = path.resolve(config.uploadDir, projectId);
    const fullFilePath = path.resolve(projectDir, requestedPath);

    // Cross-platform case-insensitive directory boundary verification
    const normProjectDir = path.normalize(projectDir).toLowerCase();
    const normFullFilePath = path.normalize(fullFilePath).toLowerCase();

    if (!normFullFilePath.startsWith(normProjectDir)) {
      return res.status(403).json({ message: 'Access denied: Directory traversal detected.' });
    }

    if (!fs.existsSync(fullFilePath)) {
      return res.status(404).json({ message: `File not found at path: ${requestedPath}` });
    }

    const content = fs.readFileSync(fullFilePath, 'utf8');
    return res.status(200).json({
      path: requestedPath,
      content,
    });
  } catch (err) {
    next(err);
  }
}


export async function getProjectArchitecture(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> {
  try {
    const projectId = req.params.id;
    const project = await Project.findOne({ _id: projectId, userId: req.user!.id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const files = await File.find({ projectId });
    const graph = architectureService.generateArchitectureGraph(files);

    return res.status(200).json(graph);
  } catch (err) {
    next(err);
  }
}

export async function getProjectIssues(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> {
  try {
    const projectId = req.params.id;
    const project = await Project.findOne({ _id: projectId, userId: req.user!.id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const { severity, type, file } = req.query;
    const filter: any = { projectId };

    if (severity) filter.severity = severity;
    if (type) filter.type = type;
    if (file) filter.file = file;

    const issues = await Issue.find(filter).sort({ severity: 1, file: 1 });
    return res.status(200).json(issues);
  } catch (err) {
    next(err);
  }
}

export async function getProjectDocumentation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> {
  try {
    const projectId = req.params.id;
    const project = await Project.findOne({ _id: projectId, userId: req.user!.id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const files = await File.find({ projectId });
    const issues = await Issue.find({ projectId });

    const mdDocumentation = reportsService.generateDocumentation(project, files, issues);
    return res.status(200).json({
      projectId,
      documentation: mdDocumentation,
    });
  } catch (err) {
    next(err);
  }
}

export async function explainCodeSegment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> {
  try {
    const projectId = req.params.id;
    const project = await Project.findOne({ _id: projectId, userId: req.user!.id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const { filePath, codeBlock, lineStart, lineEnd } = req.body;
    if (!filePath || !codeBlock) {
      return res.status(400).json({ message: 'filePath and codeBlock are required.' });
    }

    const file = await File.findOne({ projectId, path: filePath });
    const language = file ? file.language : 'javascript';

    const explanation = await aiService.explainCode({
      filePath,
      language,
      codeBlock,
      lineStart,
      lineEnd,
    });

    return res.status(200).json(explanation);
  } catch (err) {
    next(err);
  }
}

export async function suggestAlternativeCode(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> {
  try {
    const projectId = req.params.id;
    const project = await Project.findOne({ _id: projectId, userId: req.user!.id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const { filePath, codeBlock } = req.body;
    if (!filePath || !codeBlock) {
      return res.status(400).json({ message: 'filePath and codeBlock are required.' });
    }

    const file = await File.findOne({ projectId, path: filePath });
    const language = file ? file.language : 'javascript';

    const alternative = await aiService.suggestAlternative({
      filePath,
      language,
      codeBlock,
    });

    return res.status(200).json(alternative);
  } catch (err) {
    next(err);
  }
}

export async function chatWithProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> {
  try {
    const projectId = req.params.id;
    const project = await Project.findOne({ _id: projectId, userId: req.user!.id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ message: 'query is required.' });
    }

    const files = await File.find({ projectId }).select('path language functions classes');

    const chatResponse = await aiService.chatWithCodebase({
      projectName: project.name,
      query,
      languages: project.languages || [],
      frameworks: project.frameworks || [],
      files: files.map(f => ({
        path: f.path,
        language: f.language,
        functionsCount: f.functions?.length || 0,
        classesCount: f.classes?.length || 0,
      })),
      dependencies: (project.dependencies || []).map((d: any) => ({
        name: d.name,
        version: d.version,
      })),
    });

    return res.status(200).json(chatResponse);
  } catch (err) {
    next(err);
  }
}



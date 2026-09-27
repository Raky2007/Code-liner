import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { Project, File, Issue, ProjectStatus } from '../projects/models';
import { detectionService } from '../detection/detection.service';
import { parsingService } from '../parsing/parsing.service';
import { analysisService } from '../analysis/analysis.service';
import { config } from '../../config';

export class IngestionService {
  async ingestProject(projectId: string, zipFilePath: string): Promise<void> {
    console.log(`[Ingestion] Starting pipeline for project: ${projectId}`);
    const startTime = Date.now();
    
    try {
      // 1. VALIDATING
      await this.updateStatus(projectId, 'VALIDATING');
      if (!fs.existsSync(zipFilePath)) {
        throw new Error('Upload ZIP file not found on disk.');
      }

      const stats = fs.statSync(zipFilePath);
      if (stats.size > 500 * 1024 * 1024) { // 500MB file size limit
        throw new Error('Project ZIP file exceeds the maximum allowed size (500MB).');
      }

      // 2. EXTRACTING
      await this.updateStatus(projectId, 'EXTRACTING');
      const extractDir = path.join(config.uploadDir, projectId);
      
      // Ensure target extraction directory exists and is clean
      if (fs.existsSync(extractDir)) {
        fs.rmSync(extractDir, { recursive: true, force: true });
      }
      fs.mkdirSync(extractDir, { recursive: true });

      const zip = new AdmZip(zipFilePath);
      const entries = zip.getEntries();
      
      let totalSize = 0;
      let totalFiles = 0;

      for (const entry of entries) {
        if (entry.isDirectory) continue;

        // Path Traversal Security check
        const targetPath = path.resolve(extractDir, entry.entryName);
        if (!targetPath.startsWith(extractDir)) {
          throw new Error(`Security Exception: Path traversal attempt detected in ZIP: ${entry.entryName}`);
        }

        totalSize += entry.header.size;
        totalFiles++;

        if (totalSize > 2000 * 1024 * 1024) { // 2GB decompressed size limit
          throw new Error('ZIP decompression size limit exceeded (2GB safety limit).');
        }
        if (totalFiles > 50000) { // 50,000 files limit
          throw new Error('ZIP contains too many files (50,000 files safety limit).');
        }
      }

      zip.extractAllTo(extractDir, true);
      console.log(`[Ingestion] Extracted ${totalFiles} entries in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

      // 3. SCANNING
      await this.updateStatus(projectId, 'SCANNING');
      const fileList = getFilesRecursively(extractDir);
      console.log(`[Ingestion] Scanned ${fileList.length} parseable files`);

      // 4. DETECTING LANGUAGES & FRAMEWORKS
      await this.updateStatus(projectId, 'DETECTING');
      
      // Calculate language distributions
      const extCounts = new Map<string, number>();
      fileList.forEach(f => {
        const ext = path.extname(f).toLowerCase();
        if (ext) {
          extCounts.set(ext, (extCounts.get(ext) || 0) + 1);
        }
      });

      const languages = detectionService.detectLanguages(extCounts);
      const { frameworks, dependencies } = await detectionService.detectFrameworksAndDependencies(extractDir);

      // Save initial scan info to DB
      await Project.findByIdAndUpdate(projectId, {
        languages,
        frameworks,
        dependencies,
      });

      // 5. PARSING FILES (Concurrent Batches & Bulk DB Inserts)
      await this.updateStatus(projectId, 'PARSING');
      let totalLinesCount = 0;
      let totalFunctionsCount = 0;
      let totalClassesCount = 0;
      let totalParsedFilesCount = 0;

      // Clean existing files/issues for safety (in case of re-ingestion)
      await File.deleteMany({ projectId });
      await Issue.deleteMany({ projectId });

      const BATCH_CONCURRENCY = 15; // Process 15 files in parallel
      const fileInsertBuffer: any[] = [];
      const issueInsertBuffer: any[] = [];

      for (let i = 0; i < fileList.length; i += BATCH_CONCURRENCY) {
        const chunk = fileList.slice(i, i + BATCH_CONCURRENCY);
        
        await Promise.all(
          chunk.map(async (relPath) => {
            const fullPath = path.join(extractDir, relPath);
            
            if (!parsingService.isSupportedFile(relPath)) {
              return;
            }

            try {
              const fileStats = fs.statSync(fullPath);
              const code = fs.readFileSync(fullPath, 'utf8');

              // Fast-path guard: if file is > 400KB, a lockfile, or a sourcemap, route to fast generic analyzer
              const isHugeOrLock = fileStats.size > 400 * 1024 ||
                relPath.endsWith('.map') ||
                relPath.endsWith('.min.js') ||
                relPath.endsWith('.min.css') ||
                relPath.includes('-lock.') ||
                relPath.endsWith('.lock');

              let parsed;
              if (isHugeOrLock) {
                parsed = await parsingService.getGenericAnalyzer().parse(code, relPath);
              } else {
                parsed = await parsingService.parseFile(relPath, code);
              }

              fileInsertBuffer.push({
                projectId,
                path: relPath,
                language: parsed.language,
                imports: parsed.imports,
                exports: parsed.exports,
                functions: parsed.functions,
                classes: parsed.classes,
                variables: parsed.variables,
                calls: parsed.calls,
              });

              totalLinesCount += parsed.linesCount;
              totalFunctionsCount += parsed.functions.length;
              totalClassesCount += parsed.classes.length;
              totalParsedFilesCount++;

              // 6. STATIC ANALYZING
              if (!isHugeOrLock) {
                const staticIssues = analysisService.analyzeFile(relPath, code, parsed);
                if (staticIssues.length > 0) {
                  staticIssues.forEach(issue => {
                    issueInsertBuffer.push({
                      projectId,
                      file: relPath,
                      ...issue,
                    });
                  });
                }
              }
            } catch (err: any) {
              console.error(`Error parsing source file ${relPath}:`, err.message);
            }
          })
        );

        // Bulk insert files every 75 files to save database round-trips
        if (fileInsertBuffer.length >= 75) {
          const filesToFlush = fileInsertBuffer.splice(0, fileInsertBuffer.length);
          await File.insertMany(filesToFlush, { ordered: false });
        }

        // Bulk insert issues every 150 issues
        if (issueInsertBuffer.length >= 150) {
          const issuesToFlush = issueInsertBuffer.splice(0, issueInsertBuffer.length);
          await Issue.insertMany(issuesToFlush, { ordered: false });
        }
      }

      // Flush remaining buffers
      if (fileInsertBuffer.length > 0) {
        await File.insertMany(fileInsertBuffer, { ordered: false });
      }
      if (issueInsertBuffer.length > 0) {
        await Issue.insertMany(issueInsertBuffer, { ordered: false });
      }

      // 7. COMPLETED & STATS PACKING
      const totalIssuesCount = await Issue.countDocuments({ projectId });

      await Project.findByIdAndUpdate(projectId, {
        status: 'COMPLETED',
        stats: {
          totalFiles: totalParsedFilesCount,
          totalLines: totalLinesCount,
          totalFunctions: totalFunctionsCount,
          totalClasses: totalClassesCount,
          totalIssues: totalIssuesCount,
        },
      });

      console.log(`[Ingestion] Completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s for project: ${projectId}`);
    } catch (err: any) {
      console.error(`[Ingestion] Failed for project: ${projectId}`, err);
      await Project.findByIdAndUpdate(projectId, {
        status: 'FAILED',
        error: err.message || 'Unknown ingestion error.',
      });
    } finally {
      // Clean up uploaded temporary ZIP file to save disk space
      if (fs.existsSync(zipFilePath)) {
        try {
          fs.unlinkSync(zipFilePath);
        } catch (e) {
          console.warn(`Failed to clean up temp ZIP file at ${zipFilePath}:`, e);
        }
      }
    }
  }

  private async updateStatus(projectId: string, status: ProjectStatus): Promise<void> {
    console.log(`[Ingestion] Project ${projectId} status -> ${status}`);
    await Project.findByIdAndUpdate(projectId, { status });
  }
}

// Recursive helper scanning folder paths, omitting binary, temp, or IDE lockfiles
function getFilesRecursively(dir: string, baseDir: string = dir): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return [];
  
  const list = fs.readdirSync(dir);

  const ignoredDirs = [
    'node_modules', 
    '.git', 
    'dist', 
    'build', 
    'coverage', 
    '.next', 
    'target', 
    'venv', 
    '.venv', 
    '__pycache__', 
    '.agents', 
    '.gemini', 
    'vendor', 
    '.turbo', 
    '.cache', 
    'out', 
    '.output', 
    '.nuxt', 
    'bower_components', 
    '.idea', 
    '.vscode'
  ];
  const ignoredFiles = ['.DS_Store', 'Thumbs.db'];

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    const relativePath = path.relative(baseDir, filePath).replace(/\\/g, '/');

    if (stat && stat.isDirectory()) {
      if (!ignoredDirs.includes(file)) {
        results = results.concat(getFilesRecursively(filePath, baseDir));
      }
    } else {
      if (!ignoredFiles.includes(file)) {
        const ext = path.extname(file).toLowerCase();
        const binaryExtensions = [
          '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', 
          '.gz', '.mp4', '.mp3', '.woff', '.woff2', '.ttf', '.eot', '.exe', 
          '.dll', '.bin', '.iso', '.o', '.a', '.pyc'
        ];
        if (!binaryExtensions.includes(ext)) {
          results.push(relativePath);
        }
      }
    }
  });

  return results;
}

export const ingestionService = new IngestionService();
export { getFilesRecursively };

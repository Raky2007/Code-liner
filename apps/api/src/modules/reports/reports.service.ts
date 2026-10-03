import fs from 'fs';
import path from 'path';
import { IProject, IFile, IIssue } from '../projects/models';
import { config } from '../../config';

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

export class ReportsService {
  generateStructuredDocumentation(project: IProject, files: IFile[], issues: IIssue[]): DocumentationData {
    const totalFiles = project.stats?.totalFiles || files.length;
    const totalLines = project.stats?.totalLines || files.reduce((acc, f) => acc + (f.functions?.length || 0) * 25, 0);

    // 1. PROJECT OVERVIEW
    const langs = project.languages && project.languages.length > 0 ? project.languages : ['TypeScript'];
    const frameworks = project.frameworks && project.frameworks.length > 0 ? project.frameworks : ['Web Platform'];
    const primaryLanguage = langs[0] || 'TypeScript';
    const mainFramework = frameworks[0] || 'Standard Runtime';

    let purpose = project.description?.trim() || '';
    if (!purpose) {
      if (frameworks.some(f => /react|vue|svelte|next/i.test(f)) && frameworks.some(f => /express|fastify|nest/i.test(f))) {
        purpose = 'Full-stack application combining interactive client interface views with server API endpoints.';
      } else if (frameworks.some(f => /react|vue|svelte|vite/i.test(f))) {
        purpose = 'Client-side web application implementing interactive user interface components and state flows.';
      } else if (frameworks.some(f => /express|fastify|nest|flask|django/i.test(f))) {
        purpose = 'Backend service implementing REST API endpoints, business logic controllers, and data handling.';
      } else {
        purpose = 'Software project implementing modular functions and system utilities.';
      }
    }

    // Code health calculation
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const highCount = issues.filter(i => i.severity === 'high').length;
    const mediumCount = issues.filter(i => i.severity === 'medium').length;
    const lowCount = issues.filter(i => i.severity === 'low').length;

    let score = 100;
    score -= criticalCount * 15;
    score -= highCount * 8;
    score -= mediumCount * 2;
    score -= lowCount * 0.5;
    score = Math.max(20, Math.min(100, Math.round(score)));

    let healthStatus = 'Optimal';
    if (score < 60) healthStatus = 'Needs Refactoring';
    else if (score < 80) healthStatus = 'Needs Attention';
    else if (score < 90) healthStatus = 'Good';

    // 2. TECHNOLOGY STACK
    const buildToolsSet = new Set<string>();
    const databasesSet = new Set<string>();

    const deps = project.dependencies || [];
    deps.forEach(d => {
      const name = d.name.toLowerCase();
      if (/vite|webpack|rollup|esbuild|babel|tsc|typescript|eslint|prettier|ts-node/i.test(name)) {
        buildToolsSet.add(d.name);
      }
      if (/mongo|mongoose|prisma|postgres|pg|mysql|sqlite|redis|typeorm|sequelize/i.test(name)) {
        databasesSet.add(d.name);
      }
    });

    files.forEach(f => {
      const p = f.path.toLowerCase();
      if (p.includes('vite.config')) buildToolsSet.add('Vite');
      if (p.includes('tsconfig')) buildToolsSet.add('TypeScript (tsc)');
      if (p.includes('dockerfile')) databasesSet.add('Docker Container');
      if (p.includes('tailwind')) buildToolsSet.add('TailwindCSS');
    });

    const buildTools = Array.from(buildToolsSet).slice(0, 8);
    const databases = Array.from(databasesSet).slice(0, 6);

    // 3. PROJECT STRUCTURE (Curated Tree)
    const dirCountMap = new Map<string, number>();
    files.forEach(f => {
      const cleanPath = f.path.replace(/\\/g, '/');
      const parts = cleanPath.split('/');
      if (parts.length > 1) {
        const topDir = parts[0] + (parts.length > 2 && parts[0] === 'apps' ? '/' + parts[1] : '');
        dirCountMap.set(topDir, (dirCountMap.get(topDir) || 0) + 1);
      } else {
        dirCountMap.set('root', (dirCountMap.get('root') || 0) + 1);
      }
    });

    let treeText = `${project.name}/\n`;
    const topDirectories: Array<{ path: string; count: number; purpose: string }> = [];

    dirCountMap.forEach((count, dir) => {
      let dirPurpose = 'Application source modules';
      if (/api|server|backend/i.test(dir)) dirPurpose = 'Server controllers, routes, and backend business logic';
      else if (/web|frontend|client|ui/i.test(dir)) dirPurpose = 'User interface components, pages, and styling';
      else if (/src/i.test(dir)) dirPurpose = 'Core source code routines and utilities';
      else if (/public|assets/i.test(dir)) dirPurpose = 'Static assets and public client deliverables';
      else if (/root/i.test(dir)) dirPurpose = 'Configuration files, manifests, and project metadata';

      topDirectories.push({ path: dir, count, purpose: dirPurpose });
      treeText += `├── ${dir}/ (${count} files) — ${dirPurpose}\n`;
    });

    // 4. ARCHITECTURE OVERVIEW
    const layers: DocumentationArchitectureLayer[] = [];
    const hasFrontend = files.some(f => /component|page|view|layout|\.tsx|\.jsx/i.test(f.path));
    const hasRoutes = files.some(f => /route|controller|api|endpoint/i.test(f.path));
    const hasServices = files.some(f => /service|util|helper|usecase/i.test(f.path));
    const hasDatabase = databases.length > 0 || files.some(f => /model|schema|entity/i.test(f.path));

    if (hasFrontend) {
      layers.push({
        name: 'User Interface / Presentation Layer',
        description: 'Renders client view templates, state flows, and interactive user components.',
        evidence: 'Detected React / client components and page view templates.',
        modules: files.filter(f => /page|component|view/i.test(f.path)).slice(0, 3).map(f => path.basename(f.path)),
      });
    }

    if (hasRoutes) {
      layers.push({
        name: 'Routing & Application Controller Layer',
        description: 'Intercepts HTTP requests, validates request payloads, and delegates commands to domain handlers.',
        evidence: 'Detected API routing modules and controller definitions.',
        modules: files.filter(f => /route|controller/i.test(f.path)).slice(0, 3).map(f => path.basename(f.path)),
      });
    }

    if (hasServices) {
      layers.push({
        name: 'Services & Business Logic Layer',
        description: 'Implements core algorithms, external client integrations, and domain state transformations.',
        evidence: 'Detected service routines and helper utility modules.',
        modules: files.filter(f => /service|util/i.test(f.path)).slice(0, 3).map(f => path.basename(f.path)),
      });
    }

    if (hasDatabase) {
      layers.push({
        name: 'Data Storage & Persistence Layer',
        description: 'Manages schema models, database connectivity, and data persistence transactions.',
        evidence: `Supported by database dependencies: ${databases.join(', ')}.`,
        modules: files.filter(f => /model|schema|db/i.test(f.path)).slice(0, 3).map(f => path.basename(f.path)),
      });
    }

    // 5. KEY MODULES (Curated 4-8 modules, strictly genuine source code files)
    const codeExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.py', '.go', '.java', '.cs', '.php', '.rb', '.rs', '.c', '.cpp']);
    const sortedFiles = [...files]
      .filter(f => {
        const ext = path.extname(f.path).toLowerCase();
        const base = path.basename(f.path).toLowerCase();
        if (!codeExts.has(ext)) return false;
        if (/config|\.d\.ts|test|spec|\.min\.|setup|polyfill/i.test(f.path)) return false;
        if (base.startsWith('.')) return false;
        return true;
      })
      .sort((a, b) => {
        const countA = (a.functions?.length || 0) + (a.classes?.length || 0);
        const countB = (b.functions?.length || 0) + (b.classes?.length || 0);
        if (countB !== countA) return countB - countA;
        return (b.imports?.length || 0) - (a.imports?.length || 0);
      });

    // Take between 4 and 8 files, or however many real code files exist
    const selectedFiles = sortedFiles.slice(0, Math.min(8, Math.max(4, sortedFiles.length)));

    const keyModules: DocumentationKeyModule[] = selectedFiles.map(f => {
      const funcs = f.functions?.map(fn => fn.name) || [];
      const classes = f.classes?.map(c => c.name) || [];
      const symbols = [...classes, ...funcs].slice(0, 4);

      let resp = 'Implements core application module logic.';
      const p = f.path.toLowerCase();
      if (p.includes('controller')) resp = 'Handles HTTP request routing, payload validation, and controller actions.';
      else if (p.includes('service')) resp = 'Coordinates business logic, domain services, and external integrations.';
      else if (p.includes('route')) resp = 'Defines REST routing endpoints and middleware pipelines.';
      else if (p.includes('model') || p.includes('schema') || p.includes('entity')) resp = 'Defines persistence data schemas, indexes, and document models.';
      else if (p.includes('page')) resp = 'Renders top-level view pages and coordinates route state.';
      else if (p.includes('component')) resp = 'Renders reusable UI components and interactive elements.';
      else if (p.includes('server') || p.includes('main') || p.includes('app.tsx') || p.includes('app.jsx')) resp = 'Core application entry point and root orchestration module.';
      else if (p.includes('util') || p.includes('helper')) resp = 'Provides shared utility routines, formatting, and helper algorithms.';
      else if (symbols.length > 0) resp = `Exports core routines: ${symbols.slice(0, 3).join(', ')}.`;

      const rels = (f.imports || []).slice(0, 3).map(i => i.name);

      return {
        path: f.path,
        name: path.basename(f.path),
        responsibility: resp,
        functionsCount: f.functions?.length || 0,
        classesCount: f.classes?.length || 0,
        importantSymbols: symbols,
        relationships: rels,
      };
    });

    // 6. DEPENDENCIES
    const directDeps = deps.filter(d => d.type === 'direct');
    const devDeps = deps.filter(d => d.type === 'dev');

    const knownPurposes: Record<string, string> = {
      react: 'Component UI rendering framework',
      'react-dom': 'DOM rendering support for React',
      express: 'Node.js HTTP REST server framework',
      mongoose: 'MongoDB object modeling and query layer',
      vite: 'Frontend build tool and rapid development server',
      tailwindcss: 'Utility-first CSS styling engine',
      'lucide-react': 'Modern SVG icon component library',
      axios: 'Promise-based HTTP client',
      cors: 'Cross-origin resource sharing middleware',
      dotenv: 'Environment variable loader',
      typescript: 'Static type-checking compiler',
      jsonwebtoken: 'JWT authentication token signing and verification',
    };

    const highlights: Array<{ name: string; version: string; purpose: string }> = [];
    directDeps.slice(0, 8).forEach(d => {
      const purposeText = knownPurposes[d.name.toLowerCase()] || 'Application runtime dependency';
      highlights.push({
        name: d.name,
        version: d.version,
        purpose: purposeText,
      });
    });

    // 7. API ENDPOINTS (Conditional Extraction)
    const endpointsList: DocumentationEndpoint[] = [];
    const projectDir = path.resolve(config.uploadDir, project._id ? project._id.toString() : '');

    if (fs.existsSync(projectDir)) {
      const routeFiles = files.filter(f => /route|controller|api|server/i.test(f.path));
      for (const rf of routeFiles) {
        const fullPath = path.join(projectDir, rf.path);
        if (fs.existsSync(fullPath)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            const routeMatches = content.matchAll(/(?:router|app)\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*[a-zA-Z0-9_.]+\s*)*,\s*([a-zA-Z0-9_]+)/g);
            for (const match of routeMatches) {
              const method = match[1].toUpperCase();
              const routePath = match[2];
              const handler = match[3];
              endpointsList.push({
                method,
                path: routePath,
                handler,
                purpose: `Executes handler ${handler}`,
                sourceFile: rf.path,
              });
            }
          } catch (e) {
            // Ignore file read error
          }
        }
      }
    }

    const hasEndpoints = endpointsList.length > 0;

    // 8. HOW THE PROJECT WORKS (4-6 Step Flow)
    const workflow: DocumentationStep[] = [
      {
        step: 1,
        title: 'Input & Initialization',
        description: 'User enters input through the user interface or client initiates HTTP requests.',
      },
      {
        step: 2,
        title: 'Route Dispatch & Validation',
        description: 'Application routers intercept requests and validate structural parameter types.',
      },
      {
        step: 3,
        title: 'Domain Processing',
        description: 'Business logic routines execute transformations, algorithmic checks, and state updates.',
      },
      {
        step: 4,
        title: 'Persistence & External Calls',
        description: hasDatabase
          ? 'Data is queried or persisted to storage schemas via database models.'
          : 'Data states are organized and synchronized across application services.',
      },
      {
        step: 5,
        title: 'Output & Client Delivery',
        description: 'Processed data payloads and response states return to the view layer for rendering.',
      },
    ];

    // 9. CODE HEALTH & RISKS
    const topRisks = issues
      .filter(i => i.severity === 'critical' || i.severity === 'high')
      .slice(0, 3)
      .map(i => ({
        title: i.message,
        severity: i.severity,
        file: i.file,
        line: i.line,
        description: `Flagged on line ${i.line} in ${i.file}.`,
      }));

    // 10. RECOMMENDED IMPROVEMENTS (Top 3)
    const recommendedImprovements: DocumentationData['recommendedImprovements'] = [];
    if (issues.length > 0) {
      const topIssues = [...issues]
        .sort((a, b) => {
          const rank = { critical: 4, high: 3, medium: 2, low: 1 };
          return ((rank as any)[b.severity] || 0) - ((rank as any)[a.severity] || 0);
        })
        .slice(0, 3);

      topIssues.forEach(iss => {
        let action = 'Refactor code to conform with clean architecture standards.';
        let impact: 'High' | 'Medium' | 'Low' = 'High';
        let effort: 'Low' | 'Medium' | 'High' = 'Medium';
        let scoreGain = 8;

        if (/secret|key|password/i.test(iss.message)) {
          action = 'Move hardcoded credentials into runtime environment variables or secrets manager.';
          impact = 'High';
          effort = 'Low';
          scoreGain = 12;
        } else if (/complexity|bumpy/i.test(iss.message)) {
          action = 'Flatten nested conditional pyramids into early-exit guard clauses and pure validator tables.';
          impact = 'High';
          effort = 'Medium';
          scoreGain = 10;
        } else if (/dry|duplicate/i.test(iss.message)) {
          action = 'Extract repeated logic blocks into shared utility helpers.';
          impact = 'Medium';
          effort = 'Low';
          scoreGain = 6;
        }

        recommendedImprovements.push({
          problem: iss.message,
          action,
          file: iss.file,
          line: iss.line,
          impact,
          effort,
          scoreGain,
        });
      });
    } else {
      recommendedImprovements.push({
        problem: 'No critical architectural warnings detected.',
        action: 'Maintain automated regression test coverage and clean dependency auditing.',
        file: files[0]?.path || 'root',
        line: 1,
        impact: 'Low',
        effort: 'Low',
        scoreGain: 0,
      });
    }

    return {
      overview: {
        projectName: project.name,
        purpose,
        primaryLanguage,
        mainFramework,
        totalFiles,
        totalLines,
        codeHealthScore: score,
        totalIssues: issues.length,
      },
      techStack: {
        languages: langs,
        frameworks,
        buildTools,
        databases,
      },
      structure: {
        rootName: project.name,
        treeText,
        topDirectories,
      },
      architecture: {
        patternName: hasFrontend && hasRoutes ? 'Layered Client-Server Architecture' : 'Modular Component Architecture',
        description: 'Separation of concerns across presentation, routing, domain services, and persistence layers.',
        layers,
      },
      keyModules,
      dependencies: {
        directCount: directDeps.length,
        devCount: devDeps.length,
        highlights,
        all: deps.map(d => ({ name: d.name, version: d.version, type: d.type })),
      },
      endpoints: {
        detected: hasEndpoints,
        list: endpointsList,
        notice: hasEndpoints ? undefined : 'No HTTP route definitions or API endpoints were detected in this repository.',
      },
      workflow,
      codeHealth: {
        score,
        status: healthStatus,
        criticalCount,
        highCount,
        mediumCount,
        lowCount,
        topRisks,
      },
      recommendedImprovements,
    };
  }

  generateMarkdownDocumentation(data: DocumentationData): string {
    let md = `# ${data.overview.projectName} — Technical Specification\n\n`;
    md += `> ${data.overview.purpose}\n\n`;

    // A. Project Overview
    md += `## 1. Project Overview\n\n`;
    md += `* **Primary Language:** ${data.overview.primaryLanguage}\n`;
    md += `* **Main Framework:** ${data.overview.mainFramework}\n`;
    md += `* **Total Files Analyzed:** ${data.overview.totalFiles}\n`;
    md += `* **Total Lines of Code:** ${data.overview.totalLines.toLocaleString()}\n`;
    md += `* **Code Health Index:** ${data.overview.codeHealthScore}/100 (${data.codeHealth.status})\n`;
    md += `* **Detected Issues:** ${data.overview.totalIssues} concerns (${data.codeHealth.criticalCount} critical, ${data.codeHealth.highCount} high, ${data.codeHealth.mediumCount} medium, ${data.codeHealth.lowCount} low)\n\n`;

    // B. Technology Stack
    md += `## 2. Technology Stack\n\n`;
    md += `* **Languages:** ${data.techStack.languages.join(', ') || 'None detected'}\n`;
    md += `* **Frameworks & Libraries:** ${data.techStack.frameworks.join(', ') || 'Standard runtime'}\n`;
    if (data.techStack.buildTools.length > 0) {
      md += `* **Build Tools & Runtimes:** ${data.techStack.buildTools.join(', ')}\n`;
    }
    if (data.techStack.databases.length > 0) {
      md += `* **Databases & Infrastructure:** ${data.techStack.databases.join(', ')}\n`;
    }
    md += `\n`;

    // C. Project Structure
    md += `## 3. Project Structure\n\n`;
    md += `\`\`\`text\n${data.structure.treeText}\`\`\`\n\n`;

    // D. Architecture Overview
    md += `## 4. Architecture Overview\n\n`;
    md += `**Pattern:** ${data.architecture.patternName}\n\n`;
    data.architecture.layers.forEach((layer, idx) => {
      md += `### Layer ${idx + 1}: ${layer.name}\n`;
      md += `${layer.description}\n`;
      md += `* **Evidence:** ${layer.evidence}\n\n`;
    });

    // E. Key Modules
    md += `## 5. Key Modules\n\n`;
    data.keyModules.forEach(mod => {
      md += `* **\`${mod.path}\`** — ${mod.responsibility} (${mod.functionsCount} functions, ${mod.classesCount} classes)\n`;
    });
    md += `\n`;

    // F. Dependencies
    md += `## 6. Dependencies\n\n`;
    md += `**Summary:** ${data.dependencies.directCount} direct dependencies, ${data.dependencies.devCount} development dependencies.\n\n`;
    if (data.dependencies.highlights.length > 0) {
      md += `### Core Packages:\n`;
      data.dependencies.highlights.forEach(pkg => {
        md += `* **\`${pkg.name}\`** (\`${pkg.version}\`): ${pkg.purpose}\n`;
      });
      md += `\n`;
    }

    // G. API Endpoints
    md += `## 7. API Endpoints\n\n`;
    if (data.endpoints.detected && data.endpoints.list.length > 0) {
      md += `| Method | Endpoint Path | Handler | Source File |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      data.endpoints.list.forEach(ep => {
        md += `| **${ep.method}** | \`${ep.path}\` | \`${ep.handler}\` | \`${ep.sourceFile}\` |\n`;
      });
      md += `\n`;
    } else {
      md += `*Notice: ${data.endpoints.notice || 'No HTTP route definitions or API endpoints were detected in this repository.'}*\n\n`;
    }

    // H. How the Project Works
    md += `## 8. How the Project Works\n\n`;
    data.workflow.forEach(step => {
      md += `${step.step}. **${step.title}:** ${step.description}\n`;
    });
    md += `\n`;

    // I. Code Health Summary
    md += `## 9. Code Health Summary\n\n`;
    md += `* **Overall Score:** ${data.codeHealth.score}/100 (${data.codeHealth.status})\n`;
    md += `* **Concern Breakdown:** ${data.codeHealth.criticalCount} Critical, ${data.codeHealth.highCount} High, ${data.codeHealth.mediumCount} Medium, ${data.codeHealth.lowCount} Low\n`;
    if (data.codeHealth.topRisks.length > 0) {
      md += `\n### Top Detected Risks:\n`;
      data.codeHealth.topRisks.forEach(risk => {
        md += `* **[${risk.severity.toUpperCase()}]** \`${risk.file}:${risk.line}\` — ${risk.title}\n`;
      });
    }
    md += `\n`;

    // J. Recommended Improvements
    md += `## 10. Recommended Improvements\n\n`;
    data.recommendedImprovements.forEach((rec, idx) => {
      md += `${idx + 1}. **${rec.problem}**\n`;
      md += `   * **Action:** ${rec.action}\n`;
      md += `   * **Target:** \`${rec.file}:${rec.line}\` (Impact: ${rec.impact}, Effort: ${rec.effort}, Gain: +${rec.scoreGain || 5} pts)\n`;
    });
    md += `\n`;

    return md;
  }

  generateDocumentation(project: IProject, files: IFile[], issues: IIssue[]): { documentation: string; data: DocumentationData } {
    const data = this.generateStructuredDocumentation(project, files, issues);
    const documentation = this.generateMarkdownDocumentation(data);
    return { documentation, data };
  }
}

export const reportsService = new ReportsService();

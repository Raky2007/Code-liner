import { IProject, IFile, IIssue } from '../projects/models';

export class ReportsService {
  generateDocumentation(project: IProject, files: IFile[], issues: IIssue[]): string {
    const langs = project.languages.join(', ') || 'None detected';
    const frameworks = project.frameworks.join(', ') || 'None detected';
    
    let md = `# Project Documentation: ${project.name}\n\n`;
    if (project.description) {
      md += `> ${project.description}\n\n`;
    }

    // --- Overview section ---
    md += `## 1. Executive Overview\n`;
    md += `Code-Liner scanned this codebase and parsed its structure. Here is the metadata dashboard:\n\n`;
    md += `* **Languages:** ${langs}\n`;
    md += `* **Frameworks:** ${frameworks}\n`;
    md += `* **Total Files:** ${project.stats.totalFiles}\n`;
    md += `* **Total lines of code:** ${project.stats.totalLines}\n`;
    md += `* **Classes Ingested:** ${project.stats.totalClasses}\n`;
    md += `* **Functions Ingested:** ${project.stats.totalFunctions}\n`;
    md += `* **Static Analysis Issues:** ${project.stats.totalIssues}\n\n`;

    // --- File hierarchy breakdown ---
    md += `## 2. Directory Structure\n`;
    md += `Below are the source files detected in this workspace:\n\n`;
    md += `\`\`\`text\n`;
    md += `${project.name}/\n`;
    
    const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));
    sortedFiles.forEach(f => {
      md += `├── ${f.path} (${f.language})\n`;
    });
    md += `\`\`\`\n\n`;

    // --- Dependencies ---
    md += `## 3. Dependencies & Packages\n`;
    if (project.dependencies.length > 0) {
      md += `The project declares the following external libraries:\n\n`;
      md += `| Package | Version | Type |\n`;
      md += `| :--- | :--- | :--- |\n`;
      project.dependencies.forEach(d => {
        md += `| \`${d.name}\` | ${d.version} | ${d.type} dependency |\n`;
      });
      md += `\n`;
    } else {
      md += `No package.json, requirements.txt, pom.xml, or go.mod dependencies were declared at the project roots.\n\n`;
    }

    // --- Inferred API Routes ---
    md += `## 4. API Endpoints & Interfaces\n`;
    const apiFiles = files.filter(f => f.path.toLowerCase().includes('route') || f.path.toLowerCase().includes('controller'));
    if (apiFiles.length > 0) {
      md += `The following files contain routing definitions, controllers, or API bindings:\n\n`;
      apiFiles.forEach(f => {
        md += `### ${f.path}\n`;
        if (f.functions.length > 0) {
          md += `* **Endpoints / Handlers:**\n`;
          f.functions.forEach(fun => {
            md += `  - \`${fun.name}\` (complexity: ${fun.complexity}, lines ${fun.lineStart}-${fun.lineEnd})\n`;
          });
        }
        md += `\n`;
      });
    } else {
      md += `No dedicated api routes or controllers were structurally inferred. Browse source classes below.\n\n`;
    }

    // --- Classes & Functions ---
    md += `## 5. Architecture Inventory\n`;
    const filesWithClasses = files.filter(f => f.classes.length > 0);
    if (filesWithClasses.length > 0) {
      md += `### Key Classes & Structures\n`;
      filesWithClasses.forEach(f => {
        f.classes.forEach(c => {
          md += `#### class \`${c.name}\` (in \`${f.path}\`)\n`;
          md += `Spans lines ${c.lineStart} to ${c.lineEnd}.\n`;
          if (c.methods.length > 0) {
            md += `* **Declared Methods:** ${c.methods.map(m => `\`${m}\``).join(', ')}\n`;
          }
          md += `\n`;
        });
      });
    }

    const highComplexityFuncs = files
      .flatMap(f => f.functions.map(fun => ({ file: f.path, ...fun })))
      .filter(fun => fun.complexity > 8)
      .sort((a, b) => b.complexity - a.complexity);

    if (highComplexityFuncs.length > 0) {
      md += `### Complex Methods (Cyclomatic Complexity > 8)\n`;
      md += `These methods contain multiple nested branches or logical operators and may warrant simplification:\n\n`;
      md += `| File | Function | Complexity | Lines |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;
      highComplexityFuncs.forEach(fun => {
        md += `| \`${fun.file}\` | \`${fun.name}\` | **${fun.complexity}** | ${fun.lineStart}-${fun.lineEnd} |\n`;
      });
      md += `\n`;
    }

    // --- Issues summary ---
    md += `## 6. Static Analysis Summary\n`;
    if (issues.length > 0) {
      md += `Code-Liner identified **${issues.length}** issues during the static audit:\n\n`;
      
      const critical = issues.filter(i => i.severity === 'critical');
      const high = issues.filter(i => i.severity === 'high');
      const medium = issues.filter(i => i.severity === 'medium');
      const low = issues.filter(i => i.severity === 'low');

      md += `* **Critical:** ${critical.length}\n`;
      md += `* **High:** ${high.length}\n`;
      md += `* **Medium:** ${medium.length}\n`;
      md += `* **Low:** ${low.length}\n\n`;

      if (critical.length > 0 || high.length > 0) {
        md += `### High Severity Issues:\n\n`;
        [...critical, ...high].slice(0, 10).forEach(i => {
          md += `- **[${i.severity.toUpperCase()}]** \`${i.file}\` L${i.line}: ${i.message}\n`;
        });
      }
    } else {
      md += `Clean build! No static quality or complexity issues were detected.\n`;
    }

    return md;
  }
}

export const reportsService = new ReportsService();

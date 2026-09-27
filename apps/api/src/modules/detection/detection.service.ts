import fs from 'fs';
import path from 'path';

export interface DetectionResult {
  languages: string[];
  frameworks: string[];
  dependencies: { name: string; version: string; type: 'direct' | 'dev' }[];
}

export class DetectionService {
  detectLanguages(extensions: Map<string, number>): string[] {
    const langMap: { [key: string]: string } = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.go': 'Go',
      '.cpp': 'C++',
      '.h': 'C++',
      '.hpp': 'C++',
      '.cc': 'C++',
      '.c': 'C',
    };

    const aggregated = new Map<string, number>();
    extensions.forEach((count, ext) => {
      const lang = langMap[ext.toLowerCase()];
      if (lang) {
        aggregated.set(lang, (aggregated.get(lang) || 0) + count);
      }
    });

    return Array.from(aggregated.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
  }

  async detectFrameworksAndDependencies(projectDir: string): Promise<{ frameworks: string[]; dependencies: { name: string; version: string; type: 'direct' | 'dev' }[] }> {
    const frameworks = new Set<string>();
    const depMap = new Map<string, { name: string; version: string; type: 'direct' | 'dev' }>();

    // Helper to scan for manifest files up to 4 levels deep, skipping standard build/ignore dirs
    const findManifestFiles = (dir: string, targetName: string, maxDepth = 4, depth = 0): string[] => {
      if (depth > maxDepth || !fs.existsSync(dir)) return [];
      const results: string[] = [];
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const lower = entry.name.toLowerCase();
          if (lower === 'node_modules' || lower === '.git' || lower === 'dist' || lower === 'build' || lower === '.next' || entry.name.startsWith('.')) {
            continue;
          }
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            results.push(...findManifestFiles(fullPath, targetName, maxDepth, depth + 1));
          } else if (lower === targetName.toLowerCase()) {
            results.push(fullPath);
          }
        }
      } catch (err) {
        // Ignore unreadable dirs
      }
      return results;
    };

    // 1. Node.js detection (all package.json files in repository/monorepo)
    const packageJsonFiles = findManifestFiles(projectDir, 'package.json');
    for (const packageJsonPath of packageJsonFiles) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const deps = pkg.dependencies || {};
        const devDeps = pkg.devDependencies || {};

        frameworks.add('Node.js');

        // Check common frameworks & libraries
        const frameworkKeywords: { [key: string]: string } = {
          'react': 'React',
          'next': 'Next.js',
          'express': 'Express',
          '@angular/core': 'Angular',
          'vue': 'Vue',
          'svelte': 'Svelte',
          'nest': 'NestJS',
          'fastify': 'Fastify',
          'vite': 'Vite',
          'tailwindcss': 'Tailwind CSS',
          'mongoose': 'Mongoose / MongoDB',
          'prisma': 'Prisma',
          'monaco-editor': 'Monaco Editor',
          'reactflow': 'React Flow',
          '@xyflow/react': 'React Flow',
        };

        const addDependencies = (depObj: any, type: 'direct' | 'dev') => {
          for (const [name, ver] of Object.entries(depObj)) {
            const version = String(ver);
            if (!depMap.has(name)) {
              depMap.set(name, { name, version, type });
            }

            // Check framework matching
            const lowerName = name.toLowerCase();
            for (const [key, label] of Object.entries(frameworkKeywords)) {
              if (lowerName.includes(key.toLowerCase())) {
                frameworks.add(label);
              }
            }
          }
        };

        addDependencies(deps, 'direct');
        addDependencies(devDeps, 'dev');
      } catch (err) {
        console.error(`Error parsing package.json at ${packageJsonPath}:`, err);
      }
    }

    // 2. Python detection (requirements.txt)
    const reqFiles = findManifestFiles(projectDir, 'requirements.txt');
    for (const reqTxtPath of reqFiles) {
      try {
        const content = fs.readFileSync(reqTxtPath, 'utf8');
        const lines = content.split(/\r?\n/);
        
        const frameworkKeywords: { [key: string]: string } = {
          'django': 'Django',
          'flask': 'Flask',
          'fastapi': 'FastAPI',
          'tornado': 'Tornado',
          'pyramid': 'Pyramid',
          'torch': 'PyTorch',
          'tensorflow': 'TensorFlow',
          'pandas': 'Pandas',
          'scikit-learn': 'Scikit-Learn',
        };

        lines.forEach(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return;

          const match = trimmed.match(/^([a-zA-Z0-9_\-]+)\s*(?:==|>=|<=|>|<|~=)?\s*(.*)$/);
          if (match) {
            const name = match[1];
            const version = match[2] || 'latest';
            if (!depMap.has(name)) {
              depMap.set(name, { name, version, type: 'direct' });
            }

            const lowerName = name.toLowerCase();
            for (const [key, label] of Object.entries(frameworkKeywords)) {
              if (lowerName.includes(key)) {
                frameworks.add(label);
              }
            }
          }
        });
      } catch (err) {
        console.error(`Error reading requirements.txt at ${reqTxtPath}:`, err);
      }
    }

    // 3. Go detection (go.mod)
    const goModFiles = findManifestFiles(projectDir, 'go.mod');
    for (const goModPath of goModFiles) {
      try {
        const content = fs.readFileSync(goModPath, 'utf8');
        frameworks.add('Go Modules');

        const frameworkKeywords: { [key: string]: string } = {
          'github.com/gin-gonic/gin': 'Gin',
          'github.com/astaxie/beego': 'Beego',
          'github.com/labstack/echo': 'Echo',
          'github.com/fiber/fiber': 'Fiber',
        };

        const lines = content.split(/\r?\n/);
        let inRequire = false;

        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed === 'require (') {
            inRequire = true;
            return;
          }
          if (inRequire && trimmed === ')') {
            inRequire = false;
            return;
          }

          if (inRequire) {
            const match = trimmed.match(/^([^\s]+)\s+([^\s]+)/);
            if (match) {
              const name = match[1];
              const version = match[2];
              if (!depMap.has(name)) {
                depMap.set(name, { name, version, type: 'direct' });
              }

              for (const [key, label] of Object.entries(frameworkKeywords)) {
                if (name.includes(key)) {
                  frameworks.add(label);
                }
              }
            }
          } else {
            const match = trimmed.match(/^require\s+([^\s]+)\s+([^\s]+)/);
            if (match) {
              const name = match[1];
              const version = match[2];
              if (!depMap.has(name)) {
                depMap.set(name, { name, version, type: 'direct' });
              }

              for (const [key, label] of Object.entries(frameworkKeywords)) {
                if (name.includes(key)) {
                  frameworks.add(label);
                }
              }
            }
          }
        });
      } catch (err) {
        console.error(`Error parsing go.mod at ${goModPath}:`, err);
      }
    }

    // 4. Java detection (pom.xml, build.gradle)
    const pomXmlFiles = findManifestFiles(projectDir, 'pom.xml');
    for (const pomXmlPath of pomXmlFiles) {
      frameworks.add('Maven');
      try {
        const content = fs.readFileSync(pomXmlPath, 'utf8');
        if (content.includes('spring-boot')) {
          frameworks.add('Spring Boot');
        }
      } catch (err) {
        console.error(`Error reading pom.xml at ${pomXmlPath}:`, err);
      }
    }

    const gradleFiles = findManifestFiles(projectDir, 'build.gradle');
    for (const gradlePath of gradleFiles) {
      frameworks.add('Gradle');
      try {
        const content = fs.readFileSync(gradlePath, 'utf8');
        if (content.includes('spring-boot')) {
          frameworks.add('Spring Boot');
        }
      } catch (err) {
        console.error(`Error reading build.gradle at ${gradlePath}:`, err);
      }
    }

    return {
      frameworks: Array.from(frameworks),
      dependencies: Array.from(depMap.values()),
    };
  }
}

export const detectionService = new DetectionService();

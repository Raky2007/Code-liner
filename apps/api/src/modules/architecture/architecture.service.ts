import path from 'path';
import { IFile } from '../projects/models';

export interface GraphNode {
  id: string;
  label: string;
  path: string;
  archetype: 'frontend' | 'router' | 'controller' | 'service' | 'model' | 'utility' | 'unknown';
  language: string;
  position: { x: number; y: number };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'imports' | 'calls' | 'depends_on';
}

export class ArchitectureService {
  generateArchitectureGraph(files: IFile[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    
    const allFilePaths = files.map(f => f.path);

    const getArchetype = (filePath: string, fileObj: IFile): GraphNode['archetype'] => {
      const lowerPath = filePath.toLowerCase();
      if (
        lowerPath.includes('component') ||
        lowerPath.includes('page') ||
        lowerPath.includes('view') ||
        lowerPath.includes('layout') ||
        fileObj.imports.some(i => i.path.includes('react') || i.path.includes('vue') || i.path.includes('svelte'))
      ) {
        return 'frontend';
      }
      if (
        lowerPath.includes('route') ||
        lowerPath.includes('api') ||
        fileObj.calls.some(c => c.name.includes('Router') || c.name === 'route' || c.name === 'get' || c.name === 'post')
      ) {
        return 'router';
      }
      if (lowerPath.includes('controller')) {
        return 'controller';
      }
      if (lowerPath.includes('service') || lowerPath.includes('usecase') || lowerPath.includes('manager')) {
        return 'service';
      }
      if (
        lowerPath.includes('model') ||
        lowerPath.includes('schema') ||
        fileObj.imports.some(i => i.path.includes('mongoose') || i.path.includes('sequelize') || i.path.includes('prisma'))
      ) {
        return 'model';
      }
      if (
        lowerPath.includes('util') ||
        lowerPath.includes('helper') ||
        lowerPath.includes('config') ||
        lowerPath.includes('db') ||
        lowerPath.includes('connection')
      ) {
        return 'utility';
      }
      return 'unknown';
    };

    // Layers based on architectures
    const archetypeLayers: { [key in GraphNode['archetype']]: number } = {
      frontend: 100,
      router: 300,
      controller: 500,
      service: 700,
      model: 900,
      utility: 1100,
      unknown: 600,
    };

    const layerCounts: { [key in GraphNode['archetype']]: number } = {
      frontend: 0,
      router: 0,
      controller: 0,
      service: 0,
      model: 0,
      utility: 0,
      unknown: 0,
    };

    files.forEach(file => {
      const arch = getArchetype(file.path, file);
      const x = archetypeLayers[arch];
      const y = layerCounts[arch] * 120 + 80;
      layerCounts[arch]++;

      nodes.push({
        id: file.path,
        label: path.basename(file.path),
        path: file.path,
        archetype: arch,
        language: file.language,
        position: { x, y },
      });

      // Map imports to workspace paths
      file.imports.forEach(imp => {
        if (!imp.isExternal) {
          const resolvedPath = resolveRelativePath(file.path, imp.path, allFilePaths);
          if (resolvedPath) {
            edges.push({
              id: `${file.path}->${resolvedPath}`,
              source: file.path,
              target: resolvedPath,
              type: 'imports',
            });
          }
        }
      });
    });

    return { nodes, edges };
  }
}

// Heuristic resolver matching local imports like './config' to 'src/config.ts'
function resolveRelativePath(sourceFile: string, importPath: string, allFiles: string[]): string | null {
  const sourceDir = path.dirname(sourceFile);
  
  // Normalize windows backslashes
  let targetRelative = path.join(sourceDir, importPath).replace(/\\/g, '/');

  // If path starts with letters (e.g. 'src/config' on root base), make it relative check
  const candidates = [
    targetRelative,
    `${targetRelative}.ts`,
    `${targetRelative}.js`,
    `${targetRelative}.tsx`,
    `${targetRelative}.jsx`,
    `${targetRelative}/index.ts`,
    `${targetRelative}/index.js`,
  ];

  for (const cand of candidates) {
    const normalized = cand.replace(/\\/g, '/');
    const matched = allFiles.find(f => {
      const normalizedF = f.replace(/\\/g, '/');
      return normalizedF === normalized || normalizedF.endsWith(normalized);
    });
    if (matched) return matched;
  }

  return null;
}

export const architectureService = new ArchitectureService();
export { resolveRelativePath };

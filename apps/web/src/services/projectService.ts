import { apiFetch } from './api';
import { FileMetadata, CodeIssue, ArchitectureGraphData } from '../types';

export const projectService = {
  getProjects: async () => {
    return apiFetch('/api/projects');
  },

  getProjectById: async (id: string) => {
    return apiFetch(`/api/projects/${id}`);
  },

  createProject: async (name: string, description?: string) => {
    return apiFetch('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  },

  uploadProject: async (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append('project', file);
    return apiFetch(`/api/projects/${projectId}/upload`, {
      method: 'POST',
      body: formData,
    });
  },

  getProjectStatus: async (projectId: string): Promise<{ status: string; error?: string }> => {
    return apiFetch(`/api/projects/${projectId}/status`);
  },

  deleteProject: async (id: string) => {
    return apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
  },

  getFiles: async (projectId: string): Promise<FileMetadata[]> => {
    return apiFetch(`/api/projects/${projectId}/files`);
  },

  getFileContent: async (projectId: string, path: string): Promise<{ content: string }> => {
    return apiFetch(`/api/projects/${projectId}/files/content?path=${encodeURIComponent(path)}`);
  },

  getIssues: async (projectId: string, filePath?: string): Promise<CodeIssue[]> => {
    const url = filePath
      ? `/api/projects/${projectId}/issues?file=${encodeURIComponent(filePath)}`
      : `/api/projects/${projectId}/issues`;
    return apiFetch(url);
  },

  getArchitecture: async (projectId: string): Promise<ArchitectureGraphData> => {
    return apiFetch(`/api/projects/${projectId}/architecture`);
  },
};

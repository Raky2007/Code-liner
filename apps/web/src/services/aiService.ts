import { apiFetch } from './api';
import { AIExplanation, AIOptimization } from '../types';

export const aiService = {
  explainCode: async (projectId: string, filePath: string, codeBlock: string): Promise<AIExplanation> => {
    return apiFetch(`/api/projects/${projectId}/explain`, {
      method: 'POST',
      body: JSON.stringify({ filePath, codeBlock }),
    });
  },

  suggestAlternative: async (
    projectId: string,
    filePath: string,
    codeBlock: string,
    goal?: string
  ): Promise<AIOptimization> => {
    return apiFetch(`/api/projects/${projectId}/alternative`, {
      method: 'POST',
      body: JSON.stringify({ filePath, codeBlock, goal }),
    });
  },

  chatWithCodebase: async (projectId: string, query: string): Promise<{ answer: string; referencedFiles?: string[] }> => {
    return apiFetch(`/api/projects/${projectId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  },
};

import { config } from '../../config';

export interface CodeContext {
  filePath: string;
  language: string;
  codeBlock: string;
  lineStart?: number;
  lineEnd?: number;
  symbols?: {
    functions: string[];
    classes: string[];
  };
}

export interface ProjectChatContext {
  projectName: string;
  query: string;
  languages: string[];
  frameworks: string[];
  files: Array<{ path: string; language: string; functionsCount: number; classesCount: number }>;
  dependencies: Array<{ name: string; version: string }>;
}

export interface Explanation {
  shortDescription: string;
  logicSteps: string[];
  lineByLine: { line: number; explanation: string }[];
}

export interface Alternative {
  alternativeCode: string;
  explanation: string;
  complexityOriginal: string;
  complexityAlternative: string;
  tradeoffs: string;
}

export interface ChatResponse {
  answer: string;
  referencedFiles: string[];
}

export interface AIProvider {
  explainCode(context: CodeContext): Promise<Explanation>;
  suggestAlternative(context: CodeContext): Promise<Alternative>;
  chatWithCodebase(context: ProjectChatContext): Promise<ChatResponse>;
}

// --- OPENROUTER LIVE PROVIDER (OPTIMIZED FOR HIGH SPEED) ---
export class OpenRouterAIProvider implements AIProvider {
  private getApiKey(): string {
    return process.env.OPENROUTER_API_KEY || config.openrouterApiKey || '';
  }

  private getModel(): string {
    return process.env.OPENROUTER_MODEL || config.openrouterModel || 'google/gemini-2.0-flash-exp:free';
  }

  async explainCode(context: CodeContext): Promise<Explanation> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn('OpenRouter API key is not configured. Falling back to MockAIProvider.');
      return new MockAIProvider().explainCode(context);
    }

    // Limit code payload to first 400 lines if massive to speed up token ingestion
    const lines = context.codeBlock.split(/\r?\n/);
    const trimmedCode = lines.length > 400 ? lines.slice(0, 400).join('\n') + '\n// ... (truncated for fast analysis)' : context.codeBlock;

    const prompt = `You are a Code Explaining Engine for Code-Liner.
Analyze the following code from file "${context.filePath}" (language: ${context.language}):

\`\`\`
${trimmedCode}
\`\`\`

Provide a structural explanation. You must respond ONLY with a JSON object (no markdown wrapper outside the JSON block) matching this schema:
{
  "shortDescription": "A concise 1-2 sentence explanation of what this code does.",
  "logicSteps": [
    "Step 1: Description of first action",
    "Step 2: Description of next action"
  ],
  "lineByLine": [
    { "line": 1, "explanation": "Detailed explanation of this specific line." }
  ]
}

Keep logicSteps between 3 to 6 key steps. Output only valid JSON.`;

    try {
      const completionText = await this.callOpenRouter(prompt);
      return parseJSONResponse(completionText);
    } catch (err: any) {
      console.error('OpenRouter explainCode request failed:', err.message);
      return new MockAIProvider().explainCode(context);
    }
  }

  async suggestAlternative(context: CodeContext): Promise<Alternative> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn('OpenRouter API key is not configured. Falling back to MockAIProvider.');
      return new MockAIProvider().suggestAlternative(context);
    }

    const lines = context.codeBlock.split(/\r?\n/);
    const trimmedCode = lines.length > 400 ? lines.slice(0, 400).join('\n') + '\n// ... (truncated)' : context.codeBlock;

    const prompt = `You are a Code Optimizer Engine for Code-Liner.
Analyze the following code from file "${context.filePath}" (language: ${context.language}):

\`\`\`
${trimmedCode}
\`\`\`

Suggest an alternative, more optimized, cleaner, or safer implementation. You must respond ONLY with a JSON object matching this schema:
{
  "alternativeCode": "The complete rewritten code block.",
  "explanation": "Clear explanation of why this alternative is better.",
  "complexityOriginal": "O(...) time complexity",
  "complexityAlternative": "O(...) time complexity",
  "tradeoffs": "Explanation of trade-offs."
}

Output only valid JSON.`;

    try {
      const completionText = await this.callOpenRouter(prompt);
      return parseJSONResponse(completionText);
    } catch (err: any) {
      console.error('OpenRouter suggestAlternative request failed:', err.message);
      return new MockAIProvider().suggestAlternative(context);
    }
  }

  async chatWithCodebase(context: ProjectChatContext): Promise<ChatResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return new MockAIProvider().chatWithCodebase(context);
    }

    const prompt = `You are Code-Liner AI Assistant, an expert software architect analyzing the repository "${context.projectName}".
Project Details:
- Languages: ${context.languages.join(', ') || 'Various'}
- Frameworks: ${context.frameworks.join(', ') || 'Custom'}
- Dependencies: ${context.dependencies.map(d => `${d.name}@${d.version}`).slice(0, 15).join(', ')}
- Ingested Files:
${context.files.slice(0, 25).map(f => `  • ${f.path} (${f.language}, ${f.functionsCount} functions, ${f.classesCount} classes)`).join('\n')}

User Query: "${context.query}"

Provide a structured architectural answer. Format response ONLY as JSON:
{
  "answer": "Detailed markdown explanation with file citations and technical architectural insights.",
  "referencedFiles": ["path/to/relevant/file.ts"]
}`;

    try {
      const completionText = await this.callOpenRouter(prompt);
      return parseJSONResponse(completionText);
    } catch (err: any) {
      console.error('OpenRouter chat request failed:', err.message);
      return new MockAIProvider().chatWithCodebase(context);
    }
  }

  private async callOpenRouter(prompt: string): Promise<string> {
    const apiKey = this.getApiKey();
    const model = this.getModel();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20-second timeout

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'http://localhost:5000',
          'X-Title': 'Code-Liner',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2, // Lower temperature = faster, deterministic output
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter HTTP ${response.status}: ${errText}`);
      }

      const resData = await response.json();
      const content = resData.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('OpenRouter response contains empty content.');
      }

      return content;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// --- DEFAULT MOCK PROVIDER (FALLBACK) ---
export class MockAIProvider implements AIProvider {
  async explainCode(context: CodeContext): Promise<Explanation> {
    return {
      shortDescription: `[AI Mock Fallback] Explaining ${context.filePath} code.`,
      logicSteps: [
        'Loads initial function bindings and argument structures.',
        'Runs input validation procedures.',
        'Invokes business logic calculations.',
        'Returns resolved object output state.',
      ],
      lineByLine: [
        { line: context.lineStart || 1, explanation: `Executes the header bindings for source logic block` },
      ],
    };
  }

  async suggestAlternative(context: CodeContext): Promise<Alternative> {
    return {
      alternativeCode: `// Optimized alternative code (AI Mock Fallback)\n\nconst optimizeLogic = () => {\n  // code optimization proposal\n};`,
      explanation: 'Unconfigured API credentials fallback.',
      complexityOriginal: 'O(n²)',
      complexityAlternative: 'O(n)',
      tradeoffs: 'Standard time-complexity reduction trade-off.',
    };
  }

  async chatWithCodebase(context: ProjectChatContext): Promise<ChatResponse> {
    const matchedFiles = context.files
      .filter(f => f.path.toLowerCase().includes(context.query.toLowerCase().split(' ')[0]))
      .map(f => f.path);

    return {
      answer: `### Codebase Analysis for "${context.query}"\n\nBased on deterministic parsing of **${context.projectName}**:\n- **Architecture**: Contains ${context.files.length} parsed modules utilizing ${context.languages.join(', ') || 'TypeScript'}.\n- **Key Components**: Identified module entries matching dependencies (${context.dependencies.slice(0, 3).map(d => d.name).join(', ')}).\n- **Guidance**: Navigate the **Architecture** graph to view import flow or the **Explorer** to inspect class methods.`,
      referencedFiles: matchedFiles.slice(0, 3),
    };
  }
}

// JSON cleansing parser
function parseJSONResponse(text: string): any {
  let cleaned = text.trim();
  
  const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (match) {
    cleaned = match[1].trim();
  }

  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    cleaned = cleaned.substring(startIdx, endIdx + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Failed to parse JSON text:', cleaned);
    throw err;
  }
}

class AIService {
  private provider: AIProvider;

  constructor() {
    this.provider = new OpenRouterAIProvider();
  }

  setProvider(provider: AIProvider) {
    this.provider = provider;
  }

  async explainCode(context: CodeContext): Promise<Explanation> {
    return this.provider.explainCode(context);
  }

  async suggestAlternative(context: CodeContext): Promise<Alternative> {
    return this.provider.suggestAlternative(context);
  }

  async chatWithCodebase(context: ProjectChatContext): Promise<ChatResponse> {
    return this.provider.chatWithCodebase(context);
  }
}

export const aiService = new AIService();

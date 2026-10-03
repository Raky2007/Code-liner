# CodeLiner — Complete End-to-End Architectural Specification & System Documentation

> **Version:** 2.0.0  
> **Repository:** `Raky2007/Code-liner`  
> **Target Audience:** Developers, System Architects, and AI Systems (ChatGPT, Claude, etc.)  
> **Purpose:** This document is an exhaustive, self-contained technical specification of CodeLiner. Any AI system or engineer reading this document will understand the architecture, data flow, static analysis engine, Code Health scoring, API contracts, UI components, and development workflows without inspecting other files.

---

## 1. Executive Summary & Purpose

**CodeLiner** is an automated code intelligence, architectural health, and static analysis platform. It enables engineers and engineering leaders to upload any software repository as a ZIP archive and immediately obtain:

1. **What does this project do?** — An evidence-grounded project summary and technical overview extracted from manifests and source code.
2. **What technologies does it use?** — An accurate breakdown of languages, frameworks, build tools, runtimes, and databases.
3. **How is it structured?** — An interactive folder tree and entry point mapping with direct source inspection.
4. **How do its main components work together?** — An interactive visual architecture DAG (Directed Acyclic Graph) showing layers, dependency flows, and call relationships.
5. **What are its code-quality issues?** — An evidence-based static analysis engine detecting cyclomatic complexity, code smells, bumpy roads, brain methods, DRY violations, primitive obsession, and security risks.
6. **What should be improved first?** — A prioritized, evidence-based refactoring plan ("How to Improve Your Code Health" / "Increase the Score") providing concrete code fixes, before/after score simulations, and line-level diffs.

---

## 2. Monorepo Architecture & Technology Stack

CodeLiner is architected as an npm workspaces monorepo containing two core applications:

```text
code-liner v2/
├── package.json              # Monorepo root workspace configuration
├── apps/
│   ├── api/                  # Express REST Backend & Static Analyzer
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── server.ts     # HTTP server entry point & shutdown hooks
│   │   │   ├── app.ts        # Express app configuration & middleware
│   │   │   ├── config/       # Environment variables and DB connectors
│   │   │   ├── middleware/   # JWT authentication & error handlers
│   │   │   └── modules/      # Domain modules (auth, projects, parsing, ai, reports)
│   │   └── uploads/          # Uploaded repositories and extracted files
│   └── web/                  # React 18 + Vite Frontend Application
│       ├── package.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       └── src/
│           ├── main.tsx      # React root bootstrap
│           ├── App.tsx       # Route definitions & protected route wrappers
│           ├── pages/        # Top-level view pages
│           ├── components/   # Modular UI components & inspector tabs
│           ├── layouts/      # ProjectDetailLayout & navigation tabs
│           ├── services/     # API client & AI helper services
│           ├── utils/        # CodeHealthEngine v2 & AST extractors
│           └── types/        # Full TypeScript definitions
```

### 2.1 Backend Technology Stack (`apps/api`)
- **Runtime:** Node.js (v20+ recommended)
- **Language:** TypeScript 5.3+ (`tsc`, `ts-node-dev`)
- **Web Framework:** Express 4.19
- **Database / ORM:** Mongoose 8.2 + MongoDB (with automatic zero-config `mongodb-memory-server` 9.1 fallback for instant local execution without external MongoDB)
- **AST Parsing Engine:**
  - `@babel/parser` 7.24 (Full Babel parser for JavaScript, TypeScript, JSX, TSX with decorators, class properties, and dynamic imports)
  - `@babel/traverse` 7.24 (AST visitor traversing function declarations, arrow functions, class methods, and call expressions)
  - Custom Python AST regex analyzer (detects classes, methods, imports, functions, docstrings)
- **File Upload & Archive Extraction:** `multer` (multipart/form-data) + `adm-zip` (ZIP archive decompression)
- **Security & Authentication:** `jsonwebtoken` (JWT bearer tokens) + `bcryptjs` (password hashing)
- **AI Integrations:** `OpenRouterAIProvider` with fallback to `EngineeredAIProvider` (deterministic heuristic offline engine)
- **Testing:** Jest 29 + `ts-jest` + `supertest`

### 2.2 Frontend Technology Stack (`apps/web`)
- **Framework & Build:** React 18.2 + Vite 5.1
- **Language:** TypeScript 5.2
- **Routing:** React Router v6 (`react-router-dom`)
- **Styling & Design System:** Tailwind CSS 3.4 + `clsx` + `tailwind-merge`
- **Graph & Architecture Visualization:** `@xyflow/react` 12.0 (React Flow) + `dagre` 0.8.5 (hierarchical directed graph layout engine)
- **Code Viewer & Editor:** `@monaco-editor/react` 4.6 (VS Code Monaco Editor with full syntax highlighting, minimap, and line targeting)
- **Motion & Transitions:** `framer-motion` 11.0
- **Icons:** `lucide-react` (clean, modern SVG icons)

### 2.3 Design System & Theme Conventions
- **Base Background:** Clean neutral slate (`#F8FAFC`), white cards (`#FFFFFF`)
- **Borders & Dividers:** Subtle slate borders (`#E2E8F0`, `#CBD5E1`)
- **Typography:**
  - Normal text / headings: `Inter`, system-ui, sans-serif (`14–16px` body, `18–20px` section titles, `24–28px` page titles)
  - Code, metrics, file paths, AST identifiers: `JetBrains Mono`, `Consolas`, monospace (`12–13px`)
- **Color Accents:**
  - Primary / Brand: Indigo / Blue (`#2563EB`, `#4F46E5`)
  - Critical / Errors: Crimson / Rose (`#EF4444`, `#DC2626`)
  - High Risk: Amber / Orange (`#F59E0B`, `#D97706`)
  - Medium Risk: Yellow / Gold (`#EAB308`, `#CA8A04`)
  - Low Risk / Clean: Slate / Blue (`#64748B`, `#3B82F6`)
  - Success / Optimal Health: Emerald / Green (`#10B981`, `#16A34A`)

---

## 3. Ingestion & Static Analysis Pipeline

When a user uploads a repository ZIP file (`POST /api/projects/:id/upload`), CodeLiner executes an automated 8-stage asynchronous ingestion pipeline:

```text
[1. UPLOADING] -> [2. VALIDATING] -> [3. EXTRACTING] -> [4. SCANNING] 
      ↓
[5. DETECTING] -> [6. PARSING] -> [7. ANALYZING] -> [8. COMPLETED]
```

### Stage-by-Stage Workflow:

1. **Validation (`VALIDATING`)**:
   - Checks file signature, archive integrity, and ensures the archive is a valid `.zip` file under the 500MB size threshold.
2. **Extraction (`EXTRACTING`)**:
   - `adm-zip` extracts entries into `apps/api/uploads/:projectId/`.
   - Filters out junk files: `__MACOSX`, `.DS_Store`, `Thumbs.db`, `.git`, temporary lockfiles.
3. **Scanning (`SCANNING`)**:
   - Recursively walks the directory tree.
   - Detects all source files and project manifests (`package.json`, `requirements.txt`, `go.mod`, `pom.xml`, `Cargo.toml`).
   - Computes total lines of code (LOC), file sizes, and directory hierarchy.
4. **Language & Framework Detection (`DETECTING`)**:
   - Scans extensions (`.ts`, `.tsx`, `.js`, `.jsx`, `.py`, `.go`, `.java`, `.rs`, `.php`, etc.).
   - Inspects manifests to detect frameworks: React, Vue, Angular, Next.js, Express, Fastify, NestJS, Flask, Django, Spring Boot, etc.
   - Identifies build tools (`vite`, `webpack`, `rollup`, `esbuild`, `tailwind`) and databases (`mongodb`, `postgres`, `mysql`, `redis`, `prisma`, `typeorm`).
5. **AST Parsing (`PARSING`)**:
   - JavaScript/TypeScript: `@babel/parser` generates the Abstract Syntax Tree with plugins: `typescript`, `jsx`, `decorators-legacy`, `classProperties`, `dynamicImport`.
   - `@babel/traverse` traverses the AST and records:
     - **Imports:** Source library, imported specifiers, internal vs. external module.
     - **Exports:** Exported functions, classes, interfaces, variables.
     - **Functions:** Function declarations, function expressions, arrow functions, class methods, start/end line numbers, and Cyclomatic Complexity ($V(G)$).
     - **Classes:** Class names, methods, constructors, inheritance.
     - **Calls:** Callee names, invocation targets.
   - Python: Parses `import`, `from ... import`, `def ...`, `class ...`, and calculates indentation/branch complexity.
6. **Static Analysis & Concern Flagging (`ANALYZING`)**:
   - Evaluates code rules against every parsed file:
     - **High Cyclomatic Complexity:** Functions with $V(G) \ge 10$ flagged as Medium; $V(G) \ge 15$ flagged as High; $V(G) \ge 25$ flagged as Critical.
     - **Large Functions / Brain Methods:** Methods exceeding 50 lines flagged as Medium; $>100$ lines flagged as High.
     - **Hardcoded Secrets & API Keys:** Regex scans for AWS keys, Generic API tokens, private certificates, DB connection strings with passwords.
     - **Bumpy Roads / Deep Nesting:** Nested conditional statements $>4$ levels deep.
     - **DRY Violations:** Redundant duplicated logic blocks.
     - **Primitive Obsession:** Functions with $>5$ primitive parameters instead of dedicated parameter objects/interfaces.
7. **Graph Building & Completion (`COMPLETED`)**:
   - Links import statements to local project files to build the Architecture Directed Acyclic Graph (DAG).
   - Computes file-to-file dependencies, layer assignments (UI $\rightarrow$ Routing $\rightarrow$ Services $\rightarrow$ Data), and saves all documents in MongoDB.

---

## 4. Code Health Index v2 Algorithmic Specification

The Code Health Index v2 is an evidence-grounded maintainability metric ($0–100$) calculated across **5 Key Factors**:

### 4.1 The 5 Key Factors Measured

| Factor | Weight | What It Detects | Negative Impact Triggers |
| :--- | :--- | :--- | :--- |
| **1. Module & Function Smells** | **30%** | Structural cohesion issues, god classes, large methods, brain methods. | Functions $>50$ lines, methods $>100$ lines, classes with low cohesion. |
| **2. Complexity Metrics** | **25%** | Nested conditional pyramids, convoluted code paths ("bumpy roads"), high cyclomatic complexity. | Functions with $V(G) \ge 10$, nested branches $\ge 4$ deep. |
| **3. DRY Violations** | **20%** | Repetitive duplicate logic blocks increasing bug surface area. | Repeated conditional trees, copy-pasted utility algorithms. |
| **4. Primitive Obsession** | **15%** | Overuse of primitive data types (`string`, `number`, `any`) instead of domain-specific typed interfaces/value objects. | Functions with $\ge 5$ primitive arguments, unvalidated raw dictionaries. |
| **5. Organizational Factors** | **10%** | High file complexity concentration, central architectural hotspots, blast radius. | Central dependency bottlenecks where high complexity meets high fan-in. |

### 4.2 Mathematical Formula

$$\text{Code Health Score} = 100 - \min\left(100, \, \sum_{i=1}^5 \left( \text{Deduction}_i \times \text{Weight}_i \right) + \text{CriticalPenalties}\right)$$

Where:
- **Critical Issue Deduction:** $-12$ points per critical concern (hardcoded secrets, extreme complexity $V(G) > 25$).
- **High Issue Deduction:** $-6$ points per high concern.
- **Medium Issue Deduction:** $-2.5$ points per medium concern.
- **Low Issue Deduction:** $-1$ point per low concern.

### 4.3 Status Thresholds:
- **$90 - 100$:** Optimal / Healthy
- **$80 - 89$:** Good
- **$70 - 79$:** Needs Attention
- **$50 - 69$:** Needs Refactoring
- **$< 50$:** High Risk / Critical Attention Required

---

## 5. Comprehensive Feature & Page Breakdown

CodeLiner provides 8 dedicated tabs and views for any analyzed project:

```text
[Overview] | [Files & Code] | [Architecture] | [Dependencies] | [Issues & Smells] | [Documentation] | [Increase the Score]
```

### 5.1 Overview Page (`OverviewPage.tsx`)
- **Key Metrics Grid:** Analyzed files, lines of code, total functions, total classes, detected issues.
- **Code Health Index Card:** Prominent radial/score gauge, status badge, summary paragraph, and breakdown bars across the 5 Key Factors.
- **Top Risks:** 3 highest-impact architectural risks with severity badges and target locations.
- **Architecture Quick View:** Preview of primary component layers.

### 5.2 Files & Code / Explorer Page (`ExplorerPage.tsx`)
- **Interactive File Explorer:** Left-side collapsible folder tree showing all project files with status badges.
- **Monaco Code Viewer:** Embedded editor with line numbers, syntax highlighting, and minimap.
- **Right Inspector Panel (4 sub-tabs):**
  1. **AST Entities Tab (`ASTEntitiesTab.tsx`):** Lists all extracted functions, classes, imports, exports, and call targets with jump-to-line links and cyclomatic complexity numbers.
  2. **Issues Tab (`IssuesTab.tsx`):** Filters and displays all static analysis concerns detected in the open file.
  3. **AI Explain Tab (`AIExplainTab.tsx`):** Generates structured code explanations: Short description, 3–6 logic steps, and line-by-line breakdown.
  4. **AI Optimize Tab (`AIOptimizeTab.tsx`):** Generates alternative refactored code targeting specific goals (`Complexity`, `Security`, `Clean Code`, `Auto`), displaying side-by-side complexity comparisons ($V(G) \text{ original vs. alternative}$), key changes, and resolved issues.

### 5.3 Architecture Page (`ArchitecturePage.tsx`)
- **Interactive DAG Diagram:** Built using `@xyflow/react` and `dagre`. Nodes represent modules/layers, edges represent import/call dependencies.
- **Layer Filtering:** Filter between UI, Routing, Services, and Data persistence layers.
- **Node Inspector:** Click any node to view incoming dependencies (fan-in), outgoing dependencies (fan-out), and open the file directly in the Explorer.

### 5.4 Dependencies Page (`DependenciesPage.tsx`)
- **Direct vs. Development Dependencies:** Clear counts and badges.
- **Package Manifest Inventory:** Name, detected version, license, and detected purpose.
- **Search & Filter:** Instant search across dependencies.

### 5.5 Issues & Smells Page (`IssuesPage.tsx`)
- **Complete Issue Registry:** Filterable by severity (`Critical`, `High`, `Medium`, `Low`) and smell category (`Complexity`, `Large Method`, `Brain Method`, `Secret`, `DRY`, `Primitive Obsession`).
- **Interactive File Jumps:** Clicking any issue opens the exact file and jumps to the exact line number in the Monaco Editor.

### 5.6 Documentation Page (`DocumentationPage.tsx` — Redesigned 10-Section Layout)
Conforms to the 30-Second Rule, answering the 6 core questions across 10 clean, standardized sections:
1. **Section A: Project Overview:** Project name, 1-sentence purpose, 6 key metrics.
2. **Section B: Technology Stack:** Grouped badges (Languages, Frameworks/Libraries, Build Tools, Databases).
3. **Section C: Project Structure:** Expandable folder tree with file counts and direct links to open files in CodeLiner.
4. **Section D: Architecture Overview:** Visual connected diagram ($\text{UI} \rightarrow \text{Routing} \rightarrow \text{Services} \rightarrow \text{Data}$) with evidence.
5. **Section E: Key Modules:** Curated 4–8 primary source modules with responsibilities, function/class counts, and Explorer links.
6. **Section F: Dependencies:** Direct/dev summary, core package highlights, and collapsible `"View all dependencies"` searchable accordion.
7. **Section G: API Endpoints:** HTTP method badges, path, handler, and source file. Fallback notice if none detected.
8. **Section H: How the Project Works:** Numbered 5-step execution flow.
9. **Section I: Code Health Summary:** Score gauge, severity breakdown, top detected risks, links to `/issues` and `/improve-health`.
10. **Section J: Recommended Improvements:** Top 3 prioritized evidence-based recommendations with problems, actions, target files/lines, impact, effort, and score gain.
- **Export Actions:** `Copy MD` (clipboard), `Download MD` (file download), and `Export PDF` (clean print styling with navigation chrome hidden).

### 5.7 Increase the Score / Improve Code Health Page (`ImproveHealthPage.tsx`)
- Dedicated action center answering *"What can I do to increase my code health score?"*
- **Live Score Simulator:** Shows current score vs. projected potential score upon completing refactoring actions.
- **Prioritized Recommendation Cards:** Each card displays:
  - Concern title and severity badge
  - Target file and line number link
  - Impact (`High`/`Medium`/`Low`) and Effort (`Low`/`Medium`/`High`)
  - Expected score gain (e.g. `+10 pts`)
  - Problem diagnosis & recommended action
  - Action button: **"Open in Optimize"** (immediately opens the file in the Explorer with the Optimize tab pre-selected).

### 5.8 AI Assistant / Chat Drawer (`AIChatDrawer.tsx`)
- Grounded conversational copilot accessible from any page.
- Context-aware: aware of project languages, frameworks, files, dependencies, and health score.
- Sanitized markdown output: cleanly strips raw markdown header hashes (`###`) and bold asterisks (`**`) when presenting readable text to the user.

---

## 6. Complete REST API Reference

All project endpoints (except `/api/auth/*`) require a JWT bearer token in the `Authorization: Bearer <token>` HTTP header.

### 6.1 Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a new account.
  - Body: `{ email: string, password: string }`
  - Response: `{ user: IUser, token: string }`
- `POST /api/auth/login` — Login with credentials.
  - Body: `{ email: string, password: string }`
  - Response: `{ user: IUser, token: string }`
- `GET /api/auth/me` — Return current authenticated user.

### 6.2 Projects Management (`/api/projects`)
- `GET /api/projects` — List all projects belonging to the authenticated user.
- `POST /api/projects` — Create project metadata record.
  - Body: `{ name: string, description?: string }`
  - Response: `IProject`
- `GET /api/projects/:id` — Get full project details by ID.
- `DELETE /api/projects/:id` — Delete project and remove all files from disk and database.
- `POST /api/projects/:id/upload` — Upload ZIP archive (multipart/form-data with field `project`). Starts background ingestion pipeline.
  - Response: `202 Accepted` `{ message: string, projectId: string }`
- `GET /api/projects/:id/status` — Poll pipeline status (`UPLOADING` $\rightarrow$ `COMPLETED`).
- `GET /api/projects/:id/files` — Retrieve all analyzed files with AST metadata.
- `GET /api/projects/:id/files/content?path=<filePath>` — Retrieve raw source code content of a specific file.
- `GET /api/projects/:id/architecture` — Retrieve architecture DAG (nodes and edges).
- `GET /api/projects/:id/issues` — Retrieve all detected code smells and static analysis issues.
- `GET /api/projects/:id/documentation` — Retrieve structured documentation JSON (`data`) and compiled Markdown (`documentation`).

### 6.3 AI & Intelligence (`/api/projects/:id/*`)
- `POST /api/projects/:id/explain` — Generate structural explanation of a code snippet.
  - Body: `{ filePath: string, codeBlock: string, lineStart?: number, lineEnd?: number }`
  - Response: `{ shortDescription: string, logicSteps: string[], lineByLine: Array<{ line: number, explanation: string }> }`
- `POST /api/projects/:id/alternative` — Generate optimized alternative code.
  - Body: `{ filePath: string, codeBlock: string, goal: 'auto' | 'complexity' | 'security' | 'clean' }`
  - Response: `{ alternativeCode: string, explanation: string, complexityOriginal: string, complexityAlternative: string, tradeoffs: string, keyChanges: string[], resolvedIssues: string[] }`
- `POST /api/projects/:id/chat` — Conversational assistant query grounded in project context.
  - Body: `{ message: string }`
  - Response: `{ reply: string, referencedFiles: string[] }`

---

## 7. Database Models & Schema Specifications (MongoDB / Mongoose)

### 7.1 `User` Schema
```typescript
interface IUser {
  email: string;
  passwordHash: string;
  createdAt: Date;
}
```

### 7.2 `Project` Schema
```typescript
interface IProject {
  name: string;
  description?: string;
  userId: ObjectId;
  status: 'UPLOADING' | 'VALIDATING' | 'EXTRACTING' | 'SCANNING' | 'DETECTING' | 'PARSING' | 'ANALYZING' | 'COMPLETED' | 'FAILED';
  error?: string;
  languages: string[];
  frameworks: string[];
  dependencies: Array<{ name: string; version: string; type: 'direct' | 'dev' }>;
  stats: {
    totalFiles: number;
    totalLines: number;
    totalFunctions: number;
    totalClasses: number;
    totalIssues: number;
  };
  createdAt: Date;
}
```

### 7.3 `File` Schema (with AST Metadata)
```typescript
interface IFile {
  projectId: ObjectId;
  path: string;
  language: string;
  imports: Array<{ name: string; path: string; isExternal: boolean }>;
  exports: Array<{ name: string; type: 'function' | 'class' | 'variable' | 'unknown' }>;
  functions: Array<{ name: string; lineStart: number; lineEnd: number; complexity: number }>;
  classes: Array<{ name: string; lineStart: number; lineEnd: number; methods: string[] }>;
  variables: string[];
  calls: Array<{ name: string; callee: string }>;
  createdAt: Date;
}
```

### 7.4 `Issue` Schema (Static Analysis Concerns)
```typescript
interface IIssue {
  projectId: ObjectId;
  file: string;
  line: number;
  column?: number;
  type: string;             // 'complexity' | 'large_function' | 'secret' | 'dry' | 'primitive_obsession' | ...
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  metric?: {
    name: string;
    value: number;
  };
  createdAt: Date;
}
```

---

## 8. Developer Operations & Setup Guide

### 8.1 Prerequisites
- Node.js version 18.x or 20.x+
- npm version 9.x+
- (Optional) MongoDB 6.x+. If no `MONGODB_URI` environment variable is defined, CodeLiner **automatically starts an in-memory MongoDB instance** (`mongodb-memory-server`) on an ephemeral port. Zero manual database installation is required.

### 8.2 Installation & Running Locally

1. **Install dependencies across the monorepo:**
   ```bash
   npm install
   ```

2. **Start both Backend and Frontend concurrently in development mode:**
   ```bash
   npm run dev
   ```
   - **Frontend:** `http://localhost:5173/` (Vite Hot-Module Replacement)
   - **Backend API:** `http://localhost:5000/` (Express with `ts-node-dev`)

3. **Run builds:**
   ```bash
   # Build API backend
   npm run build:api

   # Build Web frontend
   npm run build:web

   # Build both workspaces
   npm run build
   ```

4. **Run test suites:**
   ```bash
   npm test
   ```

### 8.3 Environment Variables
Backend configuration (`apps/api/.env`):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=super-secret-jwt-key-codeliner
UPLOAD_DIR=./uploads
# Optional: External MongoDB URI (leave blank to use auto in-memory server)
MONGODB_URI=
# Optional: OpenRouter API Key for live LLM completions (leave blank for deterministic offline engine)
OPENROUTER_API_KEY=
OPENROUTER_MODEL=cohere/north-mini-code:free
```

---

## 9. AI Integration & Extension Guide (For ChatGPT / Claude)

If you are an AI assistant tasked with extending, debugging, or adding new features to CodeLiner, adhere to these guidelines:

1. **Adding New Language Analyzers:**
   - Implement the analyzer interface in `apps/api/src/modules/parsing/`.
   - Register the file extensions in `generic-analyzers.ts`.
   - Ensure the analyzer extracts `imports`, `exports`, `functions` with cyclomatic complexity ($V(G)$), and `classes`.
2. **Adding New Static Analysis Rules:**
   - Add rule checks in `apps/api/src/modules/parsing/static-analyzer.ts`.
   - Assign appropriate severities (`critical`, `high`, `medium`, `low`) and map them to one of the 5 Code Health Factors.
3. **Updating the UI:**
   - Keep the existing design system tokens: background `#F8FAFC`, card `#FFFFFF`, border `#E2E8F0`, Inter for prose, JetBrains Mono for code.
   - Do not remove existing tabs or features.
   - Ensure Monaco Editor links (`/files?path=<path>&line=<line>`) function consistently across all pages.
4. **Modifying Documentation Exports:**
   - Keep the 10 standardized sections (A to J) in `DocumentationPage.tsx` synchronized with `reports.service.ts` so that Markdown and PDF exports match what is visible on the web page.

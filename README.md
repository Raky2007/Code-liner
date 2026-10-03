# 🚀 Code-Liner

**Code-Liner** is a premium, AI-ready Software Intelligence Platform designed for engineers, students, and architects. It allows users to upload unfamiliar software projects, unpack them in real-time, and leverage static analysis alongside generative AI to deeply understand code structures, architectures, and implementation logic.

![Code-Liner Architecture View](https://img.shields.io/badge/Architecture-React_Flow-pink.svg?style=flat-square)
![Code-Liner Stack](https://img.shields.io/badge/Stack-React_%7C_Node.js_%7C_MongoDB-blue.svg?style=flat-square)
![AI Powered](https://img.shields.io/badge/AI-OpenRouter_Integration-emerald.svg?style=flat-square)
![Code Health Index](https://img.shields.io/badge/Code_Health_Index-54%2F100_(Needs_Refactoring)-amber.svg?style=flat-square)

---

## 📊 Code Health Index

Code-Liner calculates a Code Health Index based on multiple software-quality dimensions.

### Metrics

| Metric | Weight | Description |
|---|---:|---|
| Module & Function Smells | 30% | Detects large functions, low cohesion, brain methods and structural complexity |
| Complexity | 30% | Measures cyclomatic complexity, nesting and convoluted execution paths |
| DRY Violations | 15% | Detects duplicated and repetitive logic |
| Primitive Obsession | 10% | Detects excessive use of primitives where domain abstractions may be appropriate |
| Organizational Factors | 15% | Uses repository history to identify hotspots, knowledge concentration and change patterns |

### Current Analysis

For the current analyzed project:

- **Files:** 86
- **Functions:** 152
- **Lines of Code:** 22.8K
- **Static Issues:** 34
  - **Critical:** 1
  - **High:** 2
  - **Medium:** 23
  - **Low:** 8

### Current Health

**54 / 100 — Needs Refactoring**

This score is provisional when some metrics are not available.

Current analysis provides strong measurements for:

- Module/function smells
- Complexity

The following metrics should be marked as unavailable until their analyzers are implemented:

- DRY violations (`Not measured`)
- Primitive obsession (`Not measured`)
- Organizational factors (`Not enough Git history`)

Do not represent unavailable metrics as healthy.

### Important Findings

The current analysis identifies:

- A critical cyclomatic complexity of **31** (e.g. `validate()`)
- High complexity values including **24** (e.g. `Registration()`) and **19** (e.g. `run()`)
- Multiple functions above 100 lines
- A `Registration` function of approximately **509 lines**
- Multiple structural and maintainability concerns

### Score Philosophy

Code-Liner does not treat every issue equally.

Severity, magnitude, frequency and affected code are considered.

A critical complexity issue should have substantially more impact than a low-severity maintainability issue.

The goal of the Code Health Index is not to produce an arbitrary number.

It is intended to provide an explainable estimate of maintainability risk.

### Analysis Limitations

Code-Liner's health score depends on the analyzers available for the uploaded project.

A missing metric does not mean the code is healthy.

For example:

> **"DRY: Not measured"** does not mean **"DRY: Excellent"**

Git-based organizational analysis requires repository history.

Scores should therefore be interpreted as an analytical indicator rather than an absolute measure of software quality.

---

## ✨ Features

- **📦 Intelligent Ingestion Pipeline**: Securely upload and unpack ZIP repositories with built-in path-traversal protection and ZIP-bomb limits.
- **🔍 Polyglot AST Analysis**: Deep source code parsing for JavaScript/TypeScript (via Babel) and robust heuristic syntax analysis for Python, Java, Go, and C++.
- **🕸️ Automated Architecture Graphs**: Visualizes complex import and call dependencies as an interactive Directed Acyclic Graph (DAG) using React Flow and Dagre.
- **🤖 Context-Aware AI Code Explanations**: Select any file, function, issue, or architecture node and get an AI-powered walkthrough explaining its logic, purpose, and potential optimization alternatives (Powered by OpenRouter).
- **📂 Interactive Explorer**: Explore massive codebases through an embedded Monaco Editor instance integrated with seamless syntax highlighting.
- **🛡️ Quality & Security Scanner**: Identifies cyclomatic complexity anomalies, module smells, and provides transparent Code Health Index V2 scoring.

---

## 🛠️ Tech Stack

### Frontend (Apps/Web)
- **Framework**: React 18 & Vite
- **Styling**: Tailwind CSS & Lucide Icons
- **Visualization**: React Flow (`@xyflow/react`) with `dagre` automated layout
- **Editor**: `@monaco-editor/react`
- **Routing**: React Router DOM v6

### Backend (Apps/API)
- **Server**: Node.js & Express.js
- **Database**: MongoDB (via Mongoose)
- **AST Parsing**: `@babel/parser` & `@babel/traverse`
- **ZIP Handling**: `adm-zip`
- **Language**: TypeScript

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (Running locally on `mongodb://localhost:27017` or a cloud URI)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd code-liner\ v2

# Install backend dependencies
cd apps/api
npm install

# Install frontend dependencies
cd ../../apps/web
npm install
```

### 2. Environment Configuration
Navigate to `apps/api` and create a `.env` file from the example:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/code-liner
JWT_SECRET=your_super_secret_key
NODE_ENV=development

# AI Integration
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
```

### 3. Run the Development Servers
Code-Liner can be booted up by running the frontend and backend servers concurrently.

**Start the Backend:**
```bash
cd apps/api
npm run dev
```
*(Runs on `http://localhost:5000`)*

**Start the Frontend:**
```bash
cd apps/web
npm run dev
```
*(Runs on `http://localhost:5173` or `http://localhost:5174`)*

---

## 📖 How it Works

1. **Upload**: Users upload a `.zip` file of any source repository.
2. **Ingest**: The backend validates the payload, unzips to a safe temporary directory, and scans all viable source files.
3. **Parse & Map**: Code is tokenized and traversed. The system identifies archetypes (Controllers, Views, Models), maps import/export relations, and flags function complexity.
4. **Visualize**: Users can navigate the codebase via the dashboard. The **Architecture** tab plots a complete dependency DAG mapping how files interact.
5. **AI Interaction**: While in the **Files** tab, users highlight a tricky function and request an AI explanation, which invokes the OpenRouter API contextually aware of the file language.

---

## 🛡️ Security Measures
- **Path Traversal Guards**: Checks `path.resolve` bounds during ZIP extraction.
- **Decompression Bomb Protection**: Hard limits on file extraction sizes and file counts.
- **Local User Bypass**: Currently configured for rapid local testing via a bypassed Auth context. (Swap `middleware/auth.ts` logic for production JWT enforcement).

---

## 📝 License
Proprietary / MIT (Customize as needed)

---
*Built with ❤️ by the Code-Liner Engineering Team*

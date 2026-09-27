# 🚀 Code-Liner

**Code-Liner** is a premium, AI-ready Software Intelligence Platform designed for engineers, students, and architects. It allows users to upload unfamiliar software projects, unpack them in real-time, and leverage static analysis alongside generative AI to deeply understand code structures, architectures, and implementation logic.

![Code-Liner Architecture View](https://img.shields.io/badge/Architecture-React_Flow-pink.svg?style=flat-square)
![Code-Liner Stack](https://img.shields.io/badge/Stack-React_%7C_Node.js_%7C_MongoDB-blue.svg?style=flat-square)
![AI Powered](https://img.shields.io/badge/AI-OpenRouter_Integration-emerald.svg?style=flat-square)

---

## ✨ Features

- **📦 Intelligent Ingestion Pipeline**: Securely upload and unpack ZIP repositories with built-in path-traversal protection and ZIP-bomb limits.
- **🔍 Polyglot AST Analysis**: Deep source code parsing for JavaScript/TypeScript (via Babel) and robust heuristic syntax analysis for Python, Java, Go, and C++.
- **🕸️ Automated Architecture Graphs**: Visualizes complex import and call dependencies as an interactive Directed Acyclic Graph (DAG) using React Flow and Dagre.
- **🤖 Live AI Code Explanations**: Select any block of code and instantly get an AI-powered walkthrough explaining its logic, purpose, and potential optimization alternatives (Powered by OpenRouter).
- **📂 Interactive Explorer**: Explore massive codebases through an embedded Monaco Editor instance integrated with seamless syntax highlighting.
- **🛡️ Quality & Security Scanner**: Identifies cyclomatic complexity anomalies and suggests refactoring targets.

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
*(Runs on `http://localhost:5173`)*

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

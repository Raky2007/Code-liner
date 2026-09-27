import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateJWT } from '../../middleware/auth';
import { config } from '../../config';
import {
  createProject,
  listProjects,
  getProject,
  deleteProject,
  uploadProjectZip,
  getProjectStatus,
  getProjectFiles,
  getFileContent,
  getProjectArchitecture,
  getProjectIssues,
  getProjectDocumentation,
  explainCodeSegment,
  suggestAlternativeCode,
  chatWithProject,
} from './projects.controller';

const router = Router();

// Ensure uploads folder and uploads/temp exist
const tempDir = path.join(config.uploadDir, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.zip') {
      return cb(new Error('Only ZIP files are supported for uploads.'));
    }
    cb(null, true);
  },
});


// Authenticate all routes
router.use(authenticateJWT as any);

router.post('/', createProject);
router.get('/', listProjects);
router.get('/:id', getProject);
router.delete('/:id', deleteProject);
router.post('/:id/upload', upload.single('project'), uploadProjectZip);
router.get('/:id/status', getProjectStatus);
router.get('/:id/files', getProjectFiles);
router.get('/:id/files/content', getFileContent);
router.get('/:id/architecture', getProjectArchitecture);
router.get('/:id/issues', getProjectIssues);
router.get('/:id/documentation', getProjectDocumentation);
router.post('/:id/explain', explainCodeSegment);
router.post('/:id/alternative', suggestAlternativeCode);
router.post('/:id/chat', chatWithProject);

export default router;


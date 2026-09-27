import express from 'express';
import cors from 'cors';
import authRoutes from './modules/auth/auth.routes';
import projectRoutes from './modules/projects/projects.routes';
import { errorHandler } from './middleware/error';

const app = express();

// Apply middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Bind route modules
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// Global Error Handler (must be registered last)
app.use(errorHandler as any);

export default app;

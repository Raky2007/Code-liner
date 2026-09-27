import { Router } from 'express';
import { register, login, logout, getMe } from './auth.controller';
import { authenticateJWT } from '../../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticateJWT, getMe);

export default router;

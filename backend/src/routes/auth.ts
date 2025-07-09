import { login, adminLogin, markCodeAsUsed } from '../controllers/authController';
import { Router } from 'express';

const router = Router();

router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/mark-used', markCodeAsUsed);

export default router; 
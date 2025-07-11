import { Router } from 'express';
import { getCodes, generateCodes } from '../controllers/adminCodeController';
import adminAuth from '../middleware/auth';

const router = Router();

router.get('/', adminAuth, getCodes);
router.post('/generate', adminAuth, generateCodes);

export default router; 
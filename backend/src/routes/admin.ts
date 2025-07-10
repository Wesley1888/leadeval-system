import { Router } from 'express';
import { getAllAdmins, executeSql } from '../controllers/adminController';
import adminAuth from '../middleware/auth';

const router = Router();

// 数据库管理接口 - 需要管理员权限
router.post('/execute-sql', adminAuth, executeSql);
router.get('/list', adminAuth, getAllAdmins);

export default router; 
import { Router } from 'express';
import { executeSql } from '../controllers/adminController';
import adminAuth from '../middleware/auth';

const router = Router();

// 数据库管理接口 - 需要管理员权限
router.post('/execute-sql', adminAuth, executeSql);

export default router; 
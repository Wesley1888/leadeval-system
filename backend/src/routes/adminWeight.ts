import { Router } from 'express';
import adminAuth from '../middleware/auth';
import {
  getWeights,
  addWeight,
  updateWeight,
  deleteWeight,
  getWeightByCode
} from '../controllers/adminWeightController';

const router = Router();

// 所有路由都需要管理员权限
router.use(adminAuth);

// 获取权重列表
router.get('/', getWeights);

// 添加权重配置
router.post('/', addWeight);

// 更新权重配置
router.put('/:id', updateWeight);

// 删除权重配置
router.delete('/:id', deleteWeight);

// 根据考核码获取权重
router.get('/code/:code_id', getWeightByCode);

export default router; 
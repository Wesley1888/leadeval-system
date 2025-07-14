import { Router } from 'express';
import { 
  getEvaluationCodes,
  getEvaluationCode,
  createEvaluationCode,
  updateEvaluationCode,
  deleteEvaluationCode,
  generateEvaluationCodes,
  getEvaluationCodeStats,
  importEvaluationCodes
} from '../controllers/adminCodeController';
import adminAuth from '../middleware/auth';

const router = Router();

// 获取考核码列表
router.get('/', adminAuth, getEvaluationCodes);

// 获取单个考核码详情
router.get('/:id', adminAuth, getEvaluationCode);

// 创建考核码
router.post('/', adminAuth, createEvaluationCode);

// 更新考核码
router.put('/:id', adminAuth, updateEvaluationCode);

// 删除考核码
router.delete('/:id', adminAuth, deleteEvaluationCode);

// 批量生成考核码
router.post('/generate', adminAuth, generateEvaluationCodes);

// 获取考核码统计信息
router.get('/stats/overview', adminAuth, getEvaluationCodeStats);

// 批量导入考核码
router.post('/import', adminAuth, importEvaluationCodes);

export default router; 
import { Router } from 'express';
import { 
  getDepartments, 
  getDepartmentTree,
  getDepartment,
  createDepartment, 
  updateDepartment, 
  deleteDepartment,
  getDepartmentStats,
  importDepartments,
  getMaxDepartmentCode
} from '../controllers/adminDepartmentController';
import adminAuth from '../middleware/auth';

const router = Router();

// 获取部门列表
router.get('/', adminAuth, getDepartments);

// 获取部门树形结构
router.get('/tree', adminAuth, getDepartmentTree);

// 获取最大部门编码
router.get('/max-code', adminAuth, getMaxDepartmentCode);

// 获取单个部门详情（必须放在 /max-code 之后）
router.get('/:id', adminAuth, getDepartment);

// 创建部门
router.post('/', adminAuth, createDepartment);

// 更新部门
router.put('/:id', adminAuth, updateDepartment);

// 删除部门
router.delete('/:id', adminAuth, deleteDepartment);

// 获取部门统计信息
router.get('/stats/overview', adminAuth, getDepartmentStats);

// 批量导入部门
router.post('/import', adminAuth, importDepartments);

export default router; 
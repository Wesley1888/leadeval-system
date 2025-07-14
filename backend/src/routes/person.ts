import express from 'express';
import { 
  getPersons, 
  getPerson, 
  createPerson, 
  updatePerson, 
  deletePerson, 
  getPersonsByDepartment,
  importPersons
} from '../controllers/personController';
import adminAuth from '../middleware/auth';

const router = express.Router();

// 获取人员列表（支持分页和搜索）
router.get('/', getPersons);

// 获取单个人员详情
router.get('/:id', adminAuth, getPerson);

// 创建人员
router.post('/', adminAuth, createPerson);

// 更新人员
router.put('/:id', adminAuth, updatePerson);

// 删除人员
router.delete('/:id', adminAuth, deletePerson);

// 批量导入人员
router.post('/import', adminAuth, importPersons);

// 获取部门人员列表（兼容旧接口）
router.get('/department/list', getPersonsByDepartment);

export default router; 
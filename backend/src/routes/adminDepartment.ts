import { Router } from 'express';
import { getDepartments, addDepartment, updateDepartment, deleteDepartment } from '../controllers/adminDepartmentController';
import adminAuth from '../middleware/auth';

const router = Router();

router.get('/', adminAuth, getDepartments);
router.post('/', adminAuth, addDepartment);
router.put('/:id', adminAuth, updateDepartment);
router.delete('/:id', adminAuth, deleteDepartment);

export default router; 
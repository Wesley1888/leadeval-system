import { Router } from 'express';
import { getTasks, addTask, updateTask, deleteTask } from '../controllers/taskController';
import adminAuth from '../middleware/auth';

const router = Router();

router.get('/', adminAuth, getTasks);
router.post('/', adminAuth, addTask);
router.put('/:id', adminAuth, updateTask);
router.delete('/:id', adminAuth, deleteTask);

export default router; 
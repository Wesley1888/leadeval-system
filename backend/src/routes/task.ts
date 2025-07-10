import { Router } from 'express';
import { getTasks, addTask, updateTask, deleteTask } from '../controllers/taskController';
import adminAuth from '../middleware/auth';

const router = Router();

router.get('/', adminAuth, getTasks);
router.post('/add', adminAuth, addTask);
router.post('/update', adminAuth, updateTask);
router.post('/delete', adminAuth, deleteTask);

export default router; 
import express from 'express';
import * as adminTaskController from '../controllers/adminTaskController';

const router = express.Router();

router.get('/', adminTaskController.getTasks);
router.post('/', adminTaskController.createTask);
router.put('/:id', adminTaskController.updateTask);
router.delete('/:id', adminTaskController.deleteTask);

export default router; 
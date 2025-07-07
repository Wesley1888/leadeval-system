import express from 'express';
import { getUsersByDepartment } from '../controllers/userController';

const router = express.Router();

router.get('/', getUsersByDepartment);

export default router; 
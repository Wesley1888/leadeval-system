import express from 'express';
import { getPersonsByDepartment } from '../controllers/personController';

const router = express.Router();

router.get('/', getPersonsByDepartment);

export default router; 
import express from 'express';
import { getIndicators } from '../controllers/indicatorController';

const router = express.Router();

router.get('/', getIndicators);

export default router; 
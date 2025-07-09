import { Router } from 'express';
import {
  submitScore,
  getExcellentLimit,
  getScoresByScorer,
  exportScoresExcel,
  getAllScores,
  getScoreStat,
  getSelfScores
} from '../controllers/scoreController';
import adminAuth from '../middleware/auth';

const router = Router();

router.post('/', submitScore);
router.get('/limit', getExcellentLimit);
router.get('/', adminAuth, getScoresByScorer);
router.get('/export', adminAuth, exportScoresExcel);
router.get('/all', adminAuth, getAllScores);
router.get('/stat', adminAuth, getScoreStat);
router.get('/self', getSelfScores);

export default router; 
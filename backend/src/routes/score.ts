import express from 'express';
import {
  submitScore,
  getExcellentLimit,
  getScoresByScorer,
  exportScoresExcel,
  getAllScores,
  getScoreStat,
  getSelfScores,
  checkFinished
} from '../controllers/scoreController';
import adminAuth from '../middleware/auth';

const router = express.Router();

router.post('/', submitScore);
router.get('/limit', getExcellentLimit);
router.get('/', adminAuth, getScoresByScorer);
router.get('/export', adminAuth, exportScoresExcel);
router.get('/all', adminAuth, getAllScores);
router.get('/stat', adminAuth, getScoreStat);
router.get('/self', getSelfScores);
router.get('/finished', checkFinished);

export default router; 
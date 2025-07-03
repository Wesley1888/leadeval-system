const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/scoreController');
const adminAuth = require('../middleware/auth');

router.post('/', scoreController.submitScore);
router.get('/limit', scoreController.getExcellentLimit);
router.get('/', adminAuth, scoreController.getScoresByScorer);
router.get('/export', adminAuth, scoreController.exportScoresExcel);
router.get('/all', adminAuth, scoreController.getAllScores);
router.get('/stat', adminAuth, scoreController.getScoreStat);
router.get('/self', scoreController.getSelfScores);
router.get('/finished', scoreController.checkFinished);

module.exports = router; 
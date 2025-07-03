const express = require('express');
const router = express.Router();
const indicatorController = require('../controllers/indicatorController');

router.get('/', indicatorController.getIndicators);

module.exports = router; 
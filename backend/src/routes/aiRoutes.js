const express = require('express');
const router = express.Router();
const { recommendTaskAssignment, analyzeLeaveRisk, predictPerformance, generateProductivityReport } = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');

router.use(authenticateToken);

router.post('/recommend-assignment', recommendTaskAssignment);
router.post('/analyze-leave-risk', analyzeLeaveRisk);
router.get('/predict-performance', predictPerformance);
router.get('/productivity-report', generateProductivityReport);

module.exports = router;

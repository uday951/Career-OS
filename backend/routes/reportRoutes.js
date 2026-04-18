import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { weeklyReport, rawMetrics } from '../controllers/growthController.js';

const router = express.Router();

// GET /api/report/weekly  — full AI-analyzed report
router.get('/weekly',  protect, weeklyReport);

// GET /api/report/metrics — raw DB metrics only, no AI, instant
router.get('/metrics', protect, rawMetrics);

export default router;

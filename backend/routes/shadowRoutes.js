import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { shadowAnalyze } from '../controllers/intelligenceController.js';

const router = express.Router();

// POST /api/shadow/analyze
router.post('/analyze', protect, shadowAnalyze);

export default router;

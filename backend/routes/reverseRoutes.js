import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { reverseRecruiter } from '../controllers/intelligenceController.js';

const router = express.Router();

// POST /api/reverse/jobs
router.post('/jobs', protect, reverseRecruiter);

export default router;

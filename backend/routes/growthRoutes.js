import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { growthPlan } from '../controllers/growthController.js';

const router = express.Router();

router.post('/plan', protect, growthPlan);

export default router;

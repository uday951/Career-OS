import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  generatePortfolio,
  getPortfolio,
  updatePortfolio,
  deployPortfolio,
  downloadPortfolioPDF
} from '../controllers/portfolioController.js';

const router = express.Router();

router.post('/generate', protect, generatePortfolio);
router.get('/current', protect, getPortfolio);
router.put('/update', protect, updatePortfolio);
router.post('/deploy', protect, deployPortfolio);
router.get('/pdf', protect, downloadPortfolioPDF);

export default router;

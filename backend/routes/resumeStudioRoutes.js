import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import {
  uploadResumeSession,
  analyzeResumeATS,
  optimizeResume,
  optimizeResumeSection,
  optimizeSectionStream,
  generateVersions,
  getVersions,
  generatePDF,
  downloadPDF,
  getSessions,
  createCoverLetter,
  deleteSession,
  chatOptimizeResume
} from '../controllers/resumeStudioController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Session endpoints
router.post('/upload', protect, upload.single('resumeFile'), uploadResumeSession);
router.get('/sessions/:userId', protect, getSessions);
router.delete('/session/:id', protect, deleteSession);
router.post('/chat', protect, upload.single('resumeFile'), chatOptimizeResume);

// Optimization & analysis
router.post('/analyze', protect, analyzeResumeATS);
router.post('/optimize', protect, optimizeResume);
router.post('/optimize/section', protect, optimizeResumeSection);
router.post('/optimize/stream', protect, optimizeSectionStream);
router.post('/versions/generate', protect, generateVersions);
router.get('/versions/:id', protect, getVersions);

// PDF Compiler & download (download is public so Puppeteer/Playwright or users can fetch)
router.post('/pdf/generate', protect, generatePDF);
router.get('/pdf/:id/download', downloadPDF);

// Cover Letter
router.post('/cover-letter', protect, createCoverLetter);

export default router;

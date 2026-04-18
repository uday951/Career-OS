import express from 'express';
import { processResume, runMatchAnalysis, generateTailoredResume, createCoverLetter, learnFromRejection, discoverMatchingJobs, getCompanyIntel, createLatexResume } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/parse-resume/:resumeId', protect, processResume);
router.post('/analyze-match', protect, runMatchAnalysis);
router.post('/tailor', protect, generateTailoredResume);
router.post('/cover-letter', protect, createCoverLetter);
router.post('/feedback', protect, learnFromRejection);
router.post('/company-intel', protect, getCompanyIntel);
router.get('/discover-jobs', protect, discoverMatchingJobs);
router.post('/latex-resume', protect, createLatexResume);

export default router;

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getSettings,
  updateSettings,
  toggleAutomation,
  saveCredentials,
  getMatchScores,
  analyzeMatch,
  tailorResume,
  generateLetter,
  runAutomation,
  getReports,
  getReport,
  getDashboardStats,
} from '../controllers/automationController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// ─── Settings ─────────────────────────────────
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.patch('/settings/toggle', toggleAutomation);
router.post('/settings/credentials', saveCredentials);

// ─── Match Scores ──────────────────────────────
router.get('/matches', getMatchScores);
router.post('/matches/analyze', analyzeMatch);

// ─── Resume Tailoring ──────────────────────────
router.post('/tailor-resume', tailorResume);

// ─── Cover Letters ─────────────────────────────
router.post('/cover-letter', generateLetter);

// ─── Automation Execution ──────────────────────
router.post('/run', runAutomation);

// ─── Reports ───────────────────────────────────
router.get('/reports', getReports);
router.get('/reports/:id', getReport);

// ─── Dashboard ─────────────────────────────────
router.get('/dashboard', getDashboardStats);

export default router;

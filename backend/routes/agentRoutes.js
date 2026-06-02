import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  startAgent,
  stopAgent,
  getAgentStatus,
  getActivityLog,
  getAgentMemory,
  getEmailHistory,
  connectGmail,
  gmailCallback
} from '../controllers/agentController.js';

const router = express.Router();

router.use(protect);

router.post('/start', startAgent);
router.post('/stop', stopAgent);
router.get('/status', getAgentStatus);
router.get('/activity/:sessionId', getActivityLog);
router.get('/memory', getAgentMemory);
router.get('/emails', getEmailHistory);
router.get('/gmail/connect', connectGmail);
router.get('/gmail/callback', gmailCallback);

export default router;

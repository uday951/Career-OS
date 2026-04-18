import express from 'express';
import { createJob, getMyJobs, updateJobStatus, linkResume, autoApplyJob, getApplicationByJob } from '../controllers/jobController.js';
import { updateApplicationStatus } from '../controllers/growthController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').post(protect, createJob).get(protect, getMyJobs);
router.route('/auto-apply').post(protect, autoApplyJob);
router.route('/:id/status').put(protect, updateJobStatus);
router.route('/:id/resume').put(protect, linkResume);
router.route('/application/:jobId').get(protect, getApplicationByJob);

// PATCH /api/jobs/application/:id/status — manual status update with notes
router.patch('/application/:id/status', protect, updateApplicationStatus);

export default router;


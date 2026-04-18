import express from 'express';
import multer from 'multer';
import { uploadResume, getMyResumes } from '../controllers/resumeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.route('/').get(protect, getMyResumes);
router.route('/upload').post(protect, upload.single('resumeFile'), uploadResume);

export default router;

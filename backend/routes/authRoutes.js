import express from 'express';
import { registerUser, authUser, getUserProfile, googleAuth } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/google', googleAuth);
router.get('/me', protect, getUserProfile);

export default router;

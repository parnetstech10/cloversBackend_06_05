import express from 'express';
const router = express.Router();
import {
  registerUser,
  authUser,
  getUserProfile,
  getAllusers,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

// Public routes
router.post('/register', registerUser);
router.post('/login', authUser);
router.get("/getAllusers",getAllusers);
// Protected routes
router.get('/profile', protect, getUserProfile);

export default router;
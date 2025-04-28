import express from 'express';
const router = express.Router();
import {
  registerUser,
  authUser,
  getUserProfile,
  getAllusers,
  updateMember,
  deleteUser
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

import multer from 'multer';

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/profile");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "_" + file.originalname);
  },
});

const upload = multer({ storage: storage });
// Public routes
router.post('/register', registerUser);
router.post('/login', authUser);
router.get("/getAllusers",getAllusers);
router.put("/updatemember/:id",upload.any(),updateMember)
// Protected routes
router.get('/profile', protect, getUserProfile);
router.delete("/deletemember/:id",  deleteUser);
export default router;
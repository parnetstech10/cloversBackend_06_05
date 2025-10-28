import express from 'express';
const router = express.Router();
import {
  registerUser,
  authUser,
  getUserProfile,
  getAllusers,
  updateMember,
  // <<<<<<< HEAD
  updateMemberImg,
  getMemberImg,
  // =======
  deleteUser,
  forgotPassword,
  resetPassword,
  sendPasswordOtp,
  verifyPasswordOtp,
  resetPasswordWithOtp
  // >>>>>>> 924daf026b58d82e80af24cfa0b4db1a4905733c
} from '../controllers/userController.js';
import { updateFCMToken } from '../controllers/fcmController.js';
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

const upload = multer();
// Public routes
router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
// OTP password reset flow
router.post('/password-otp', sendPasswordOtp);
router.post('/password-otp/verify', verifyPasswordOtp);
router.post('/password-otp/reset', resetPasswordWithOtp);
router.get("/getAllusers",getAllusers);

// FCM Token Management Routes
router.post('/update-fcm-token', updateFCMToken);
// <<<<<<< HEAD
// router.put("/updatemember/:id",upload.any(),protect,updateMember)
router.put("/updateMemberImg/:id",upload.any(),updateMemberImg)
router.get("/getMemberImg/:id",getMemberImg)

// =======
router.put("/updatemember/:id",upload.any(),updateMember)
// >>>>>>> 924daf026b58d82e80af24cfa0b4db1a4905733c
// Protected routes
router.get('/profile', protect, getUserProfile);
router.delete("/deletemember/:id",  deleteUser);
export default router;
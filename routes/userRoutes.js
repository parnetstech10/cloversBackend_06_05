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
  deleteUser
// >>>>>>> 924daf026b58d82e80af24cfa0b4db1a4905733c
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
// <<<<<<< HEAD
router.put("/updatemember/:id",upload.any(),protect,updateMember)
router.put("/updateMemberImg/:id",upload.any(),updateMemberImg)
router.get("/getMemberImg/:id",getMemberImg)

// =======
router.put("/updatemember/:id",upload.any(),updateMember)
// >>>>>>> 924daf026b58d82e80af24cfa0b4db1a4905733c
// Protected routes
router.get('/profile', protect, getUserProfile);
router.delete("/deletemember/:id",  deleteUser);
export default router;
import express from 'express';
import {
  createGuest,
  getAllGuests,
  getGuestById,
  getGuestByMembershipNo,
  updateGuest,
  deleteGuest,
  searchGuests,
  getGuestsByStatus,
  updateWalletBalance,
  verifyOTPAndRegister,
  resendOTP
} from '../controllers/guest.js';
const router = express.Router();
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

// Create a new guest (initiates OTP process)
router.post('/', upload.any(), createGuest);

// Verify OTP and complete guest registration
router.post('/verify-otp', verifyOTPAndRegister);

// Resend OTP
router.post('/resend-otp', resendOTP);

// Get all guests with pagination
router.get('/', getAllGuests);

// Search guests
router.get('/search', searchGuests);

// Get guests by status
router.get('/status/:status', getGuestsByStatus);

// Get guest by membership number
router.get('/guestbymembershipNo/:membershipNo', getGuestByMembershipNo);

// Get guest by ID
router.get('/:id', getGuestById);

// Update guest
router.put('/:id', upload.any(), updateGuest);

// Delete guest
router.delete('/:id', deleteGuest);

// Update wallet balance
router.patch('/:id/wallet', updateWalletBalance);

export default router;
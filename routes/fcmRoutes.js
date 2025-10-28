// routes/fcmRoutes.js
import express from 'express';
import {
  updateFCMToken,
  sendNotificationToUser,
  sendBulkNotification,
  sendMembershipExpiryNotifications,
  clearFCMToken,
  getFCMTokenByUserId,
  getAllActiveTokens,
  getFCMTokenStats
} from '../controllers/fcmController.js';

const router = express.Router();

// FCM Token Management Routes
router.post('/update-token', updateFCMToken);
router.post('/clear-token', clearFCMToken);
router.get('/token/:userId', getFCMTokenByUserId);
router.get('/all-tokens', getAllActiveTokens);
router.get('/stats', getFCMTokenStats);

// Notification Routes
router.post('/send-notification', sendNotificationToUser);
router.post('/fcmToken', sendNotificationToUser); // Add this endpoint to match working project
router.post('/bulk-notification', sendBulkNotification);
router.post('/membership-expiry-notifications', sendMembershipExpiryNotifications);

export default router;



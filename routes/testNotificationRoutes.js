// test-notification-endpoint.js
// Simple test endpoint to send notifications

import express from 'express';
import { sendNotificationToUser, sendBulkNotification } from '../controllers/fcmController.js';
import FCMtoken from '../models/FCMtoken.js';
import User from '../models/User.js';

const router = express.Router();

// Test single notification
router.post('/test-single', async (req, res) => {
  try {
    const { userId, title, body } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    // Find user's FCM token
    const fcmRecord = await FCMtoken.findOne({ 
      userId: userId, 
      isActive: true 
    });

    if (!fcmRecord) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active FCM token found for this user' 
      });
    }

    // Send notification (don't pass res to avoid double response)
    const mockRes = {
      status: (code) => ({ json: (data) => console.log('Mock response:', data) }),
      json: (data) => console.log('Mock response:', data)
    };
    
    const result = await sendNotificationToUser({
      body: {
        userId: userId,
        title: title || '🧪 Test Notification',
        body: body || 'This is a test notification from the backend!'
      }
    }, mockRes);

    res.json({
      success: true,
      message: 'Test notification sent successfully',
      data: {
        userId,
        platform: fcmRecord.platform,
        deviceId: fcmRecord.deviceId,
        result: result
      }
    });

  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send test notification',
      error: error.message 
    });
  }
});

// Test bulk notification
router.post('/test-bulk', async (req, res) => {
  try {
    const { userIds, title, body } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ 
        success: false, 
        message: 'User IDs array is required' 
      });
    }

    // Send bulk notification (don't pass res to avoid double response)
    const mockRes = {
      status: (code) => ({ json: (data) => console.log('Mock response:', data) }),
      json: (data) => console.log('Mock response:', data)
    };
    
    const result = await sendBulkNotification({
      body: {
        employeeIds: userIds,
        title: title || '📢 Bulk Test Notification',
        body: body || 'This is a bulk test notification from the backend!'
      }
    }, mockRes);

    res.json({
      success: true,
      message: 'Bulk test notification sent successfully',
      data: {
        userIds,
        successCount: result?.successCount || 0,
        failureCount: result?.failureCount || 0,
        result: result
      }
    });

  } catch (error) {
    console.error('Bulk test notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send bulk test notification',
      error: error.message 
    });
  }
});

// Get all FCM tokens for testing
router.get('/tokens', async (req, res) => {
  try {
        const tokens = await FCMtoken.find({ isActive: true })
          .populate('userId', 'Member_Name email')
          .sort({ lastUpdated: -1 });

    res.json({
      success: true,
      data: tokens.filter(token => token.userId).map(token => ({
        userId: token.userId._id,
        userName: token.userId.Member_Name,
        email: token.userId.email,
        platform: token.platform,
        deviceId: token.deviceId,
        lastUpdated: token.lastUpdated,
        tokenPreview: token.fcmToken.substring(0, 20) + '...'
      }))
    });

  } catch (error) {
    console.error('Get tokens error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get FCM tokens',
      error: error.message 
    });
  }
});

// Test membership expiry notification
router.post('/test-expiry', async (req, res) => {
  try {
    const { userId, daysUntilExpiry } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    // Find user's FCM token
    const fcmRecord = await FCMtoken.findOne({ 
      userId: userId, 
      isActive: true 
    });

    if (!fcmRecord) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active FCM token found for this user' 
      });
    }

    const days = daysUntilExpiry || 7;
    const title = `⏰ Membership Expiry Alert`;
    const body = `Your membership expires in ${days} day${days > 1 ? 's' : ''}. Please renew to continue enjoying our services.`;

    // Send notification (don't pass res to avoid double response)
    const mockRes = {
      status: (code) => ({ json: (data) => console.log('Mock response:', data) }),
      json: (data) => console.log('Mock response:', data)
    };
    
    const result = await sendNotificationToUser({
      body: {
        userId: userId,
        title,
        body
      }
    }, mockRes);

    res.json({
      success: true,
      message: 'Membership expiry test notification sent successfully',
      data: {
        userId,
        daysUntilExpiry: days,
        platform: fcmRecord.platform,
        result: result
      }
    });

  } catch (error) {
    console.error('Membership expiry test error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send membership expiry test notification',
      error: error.message 
    });
  }
});

// Simple test endpoint without Firebase dependency
router.get('/test-simple', async (req, res) => {
  try {
    // Get FCM tokens without Firebase
        const tokens = await FCMtoken.find({ isActive: true })
          .populate('userId', 'Member_Name email')
          .sort({ lastUpdated: -1 });

    res.json({
      success: true,
      message: 'FCM tokens retrieved successfully (without Firebase)',
      data: tokens.filter(token => token.userId).map(token => ({
        userId: token.userId._id,
        userName: token.userId.Member_Name,
        email: token.userId.email,
        platform: token.platform,
        deviceId: token.deviceId,
        lastUpdated: token.lastUpdated,
        tokenPreview: token.fcmToken.substring(0, 20) + '...',
        fcmToken: token.fcmToken // Full token for testing
      }))
    });

  } catch (error) {
    console.error('Simple test error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get FCM tokens',
      error: error.message 
    });
  }
});

// Test notification preparation (without sending)
router.post('/test-prepare', async (req, res) => {
  try {
    const { userId, title, body } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID is required' 
      });
    }

    // Find user's FCM token
    const fcmRecord = await FCMtoken.findOne({ 
      userId: userId, 
      isActive: true 
    });

    if (!fcmRecord) {
      return res.status(404).json({ 
        success: false, 
        message: 'No active FCM token found for this user' 
      });
    }

    // Prepare notification payload (without sending)
    const notificationPayload = {
      token: fcmRecord.fcmToken,
      notification: {
        title: title || '🧪 Test Notification',
        body: body || 'This is a test notification from the backend!'
      },
      data: {
        type: 'test_notification',
        timestamp: new Date().toISOString()
      }
    };

    res.json({
      success: true,
      message: 'Notification payload prepared successfully',
      data: {
        userId,
        userName: fcmRecord.userId?.Member_Name || 'Unknown',
        platform: fcmRecord.platform,
        deviceId: fcmRecord.deviceId,
        notificationPayload,
        note: 'To actually send this notification, Firebase credentials need to be configured'
      }
    });

  } catch (error) {
    console.error('Test prepare error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to prepare notification',
      error: error.message 
    });
  }
});

export default router;
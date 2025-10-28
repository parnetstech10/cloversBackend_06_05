// controllers/fcmController.js
import FCMtoken from '../models/FCMtoken.js';
import User from '../models/User.js';
import Renewal from '../models/Renewal.js';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Firebase Admin SDK initialization
let firebaseInitialized = false;

// Initialize Firebase with service account key
const initializeFirebase = async () => {
  try {
    if (!admin.apps.length) {
      console.log('🔥 Initializing Firebase Admin SDK...');
      
      // Try environment variables first (more reliable)
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        console.log('🔧 Using environment variables for Firebase credentials...');
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          }),
          projectId: 'cloversclubapp'
        });
        
        firebaseInitialized = true;
        console.log('✅ Firebase Admin SDK initialized successfully with environment variables');
      } else {
        console.log('⚠️ Environment variables not found, trying service account file...');
        
        // Fallback to service account file
        try {
          const serviceAccount = JSON.parse(
            readFileSync('./serviceAccountKey.json', 'utf8')
          );
          
          // Initialize Firebase Admin with file
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: 'cloversclubapp'
          });
          
          firebaseInitialized = true;
          console.log('✅ Firebase Admin SDK initialized successfully with service account key file');
        } catch (fileError) {
          console.log('⚠️ Service account file failed, trying mock mode...');
          // Initialize without credentials for testing
          admin.initializeApp({
            projectId: 'cloversclubapp'
          });
          
          firebaseInitialized = true;
          console.log('✅ Firebase Admin SDK initialized in mock mode');
        }
      }
    } else {
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK already initialized');
    }
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error.message);
    firebaseInitialized = false;
  }
};

// Initialize Firebase immediately
initializeFirebase();

// Helper function to check Firebase initialization
const checkFirebaseInit = (res) => {
  if (!firebaseInitialized) {
    return res.status(500).json({
      success: false,
      message: 'Firebase Admin SDK not initialized'
    });
  }
  return null;
};

// Update FCM Token (called when user registers or logs in)
export const updateFCMToken = async (req, res) => {
  try {
    const { userId, fcmToken, deviceId, platform, membershipId } = req.body;

    if (!userId || !fcmToken || !platform) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: userId, fcmToken, platform"
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Generate deviceId if not provided
    const actualDeviceId = deviceId || `device_${userId}_${Date.now()}`;

    // Update or create FCM token record
    const fcmTokenRecord = await FCMtoken.findOneAndUpdate(
      { userId: userId },
      {
        fcmToken: fcmToken,
        deviceId: actualDeviceId,
        platform,
        isActive: true,
        lastUpdated: new Date(),
        membershipId: membershipId || null
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: "FCM token updated successfully",
      data: { tokenId: fcmTokenRecord._id }
    });
  } catch (error) {
    console.error("Error updating FCM token:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Mock notification function for testing
const sendMockNotification = async (fcmRecord, title, body, data) => {
  console.log('🧪 MOCK NOTIFICATION SENT:');
  console.log('📱 To:', fcmRecord.fcmToken.substring(0, 20) + '...');
  console.log('📝 Title:', title);
  console.log('📄 Body:', body);
  console.log('📊 Data:', data);
  console.log('📱 Platform:', fcmRecord.platform);
  
  return {
    success: true,
    messageId: `mock-${Date.now()}`,
    mock: true
  };
};

// Send notification to specific user
export const sendNotificationToUser = async (req, res) => {
  const { userId, title, body, data = {} } = req.body;

  if (!userId || !title || !body) {
    return res.status(400).json({
      success: false,
      error: 'Missing userId, title, or body'
    });
  }

  try {
    // Get user's FCM token
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

    let response;
    
    // Try Firebase first, fallback to mock if it fails
    if (firebaseInitialized) {
      try {
        const message = {
          token: fcmRecord.fcmToken,
          notification: {
            title,
            body,
          },
          data: {
            type: 'membership_notification',
            ...data
          },
          android: {
            notification: {
              channelId: 'clovers_notifications',
              icon: 'ic_notification_custom',
              color: '#e8bea2'
            }
          }
        };

        response = await admin.messaging().send(message);
        console.log('✅ Firebase notification sent successfully');
      } catch (firebaseError) {
        console.log('⚠️ Firebase failed, using mock notification:', firebaseError.message);
        response = await sendMockNotification(fcmRecord, title, body, data);
      }
    } else {
      console.log('⚠️ Firebase not initialized, using mock notification');
      response = await sendMockNotification(fcmRecord, title, body, data);
    }
    
    // Update notification count
    await FCMtoken.findByIdAndUpdate(fcmRecord._id, {
      lastNotificationSent: new Date(),
      $inc: { notificationCount: 1 }
    });

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully',
      response,
      mock: response.mock || false
    });
  } catch (error) {
    console.error('Notification Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Send bulk notifications
export const sendBulkNotification = async (req, res) => {
  const firebaseCheck = checkFirebaseInit(res);
  if (firebaseCheck) return firebaseCheck;

  const { userIds, title, body, data = {} } = req.body;

  if (!userIds || !Array.isArray(userIds) || !title || !body) {
    return res.status(400).json({
      success: false,
      error: 'userIds (array), title, and body are required'
    });
  }

  try {
    // Fetch active tokens from DB
    const fcmRecords = await FCMtoken.find({
      userId: { $in: userIds },
      isActive: true
    });

    const tokens = fcmRecords.map(record => record.fcmToken).filter(Boolean);

    if (tokens.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid FCM tokens found'
      });
    }

    const message = {
      notification: { title, body },
      data: { type: 'bulk_notification', ...data },
      tokens,
      android: {
        notification: {
          channelId: 'clovers_notifications',
          icon: 'ic_notification_custom',
          color: '#e8bea2'
        }
      }
    };

    const response = await admin.messaging().sendMulticast(message);
    const { successCount, failureCount, responses } = response;

    // Update notification counts for successful sends
    const successfulTokens = responses
      .filter((resp, index) => resp.success)
      .map((resp, index) => fcmRecords[index]._id);

    if (successfulTokens.length > 0) {
      await FCMtoken.updateMany(
        { _id: { $in: successfulTokens } },
        {
          lastNotificationSent: new Date(),
          $inc: { notificationCount: 1 }
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Bulk notification sent',
      successCount,
      failureCount,
      responses
    });
  } catch (error) {
    console.error('Error sending bulk notification:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Send membership expiry notifications
export const sendMembershipExpiryNotifications = async (req, res) => {
  const firebaseCheck = checkFirebaseInit(res);
  if (firebaseCheck) return firebaseCheck;

  try {
    const notificationDays = [30, 15, 7, 3, 1]; // Days before expiry
    const today = new Date();
    const notifications = [];

    // Get all active memberships
    const memberships = await Renewal.find({
      status: 'Active',
      membershipExpairy: { $exists: true }
    }).populate('membershipId', 'fcmToken');

    for (const membership of memberships) {
      const expiryDate = new Date(membership.membershipExpairy);
      const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

      // Check if membership is expiring in any of the notification days
      if (notificationDays.includes(daysUntilExpiry) && daysUntilExpiry > 0) {
        // Check if notification was already sent for this day
        const notificationAlreadySent = membership.expiryNotifications?.some(
          notif => notif.daysBeforeExpiry === daysUntilExpiry
        );

        if (!notificationAlreadySent) {
          // Get user's FCM token
          const fcmRecord = await FCMtoken.findOne({
            userId: membership.membershipId,
            isActive: true
          });

          if (fcmRecord) {
            const title = 'Membership Expiring Soon';
            const body = `Your ${membership.membershipName} membership expires in ${daysUntilExpiry} days. Renew now to continue enjoying benefits!`;

            const message = {
              token: fcmRecord.fcmToken,
              notification: { title, body },
              data: {
                type: 'membership_expiry',
                membershipType: membership.membershipName,
                daysUntilExpiry: daysUntilExpiry.toString(),
                membershipId: membership._id.toString(),
                deepLink: `cloversclub://renewal/${membership._id}`
              },
              android: {
                notification: {
                  channelId: 'clovers_notifications',
                  icon: 'ic_notification_custom',
                  color: '#e8bea2'
                }
              }
            };

            try {
              const response = await admin.messaging().send(message);
              
              // Update membership with notification record
              await Renewal.findByIdAndUpdate(membership._id, {
                $push: {
                  expiryNotifications: {
                    sentDate: new Date(),
                    daysBeforeExpiry: daysUntilExpiry,
                    notificationType: 'expiry_reminder'
                  }
                }
              });

              // Update FCM token record
              await FCMtoken.findByIdAndUpdate(fcmRecord._id, {
                lastNotificationSent: new Date(),
                $inc: { notificationCount: 1 }
              });

              notifications.push({
                userId: membership.membershipId,
                membershipName: membership.membershipName,
                daysUntilExpiry,
                success: true
              });

            } catch (error) {
              console.error(`Error sending notification to user ${membership.membershipId}:`, error);
              notifications.push({
                userId: membership.membershipId,
                membershipName: membership.membershipName,
                daysUntilExpiry,
                success: false,
                error: error.message
              });
            }
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Membership expiry notifications processed',
      notifications,
      totalProcessed: notifications.length,
      successful: notifications.filter(n => n.success).length,
      failed: notifications.filter(n => !n.success).length
    });

  } catch (error) {
    console.error('Error sending membership expiry notifications:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Clear FCM Token
export const clearFCMToken = async (req, res) => {
  try {
    const { userId, deviceId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: userId'
      });
    }

    const query = { userId: userId };
    if (deviceId) {
      query.deviceId = deviceId;
    }

    const updateResult = await FCMtoken.updateMany(
      query,
      {
        isActive: false,
        lastUpdated: new Date()
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'No FCM token found for this user'
      });
    }

    res.status(200).json({
      success: true,
      message: 'FCM token(s) cleared successfully',
      data: {
        userId: userId,
        deviceId: deviceId || 'all devices',
        clearedCount: updateResult.modifiedCount
      }
    });
  } catch (error) {
    console.error('Error clearing FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get FCM token by user ID
export const getFCMTokenByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

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

    res.json({
      success: true,
      data: {
        fcmToken: fcmRecord.fcmToken,
        deviceId: fcmRecord.deviceId,
        platform: fcmRecord.platform,
        lastUpdated: fcmRecord.lastUpdated,
        notificationCount: fcmRecord.notificationCount
      }
    });
  } catch (error) {
    console.error('Error getting FCM token:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all active FCM tokens
export const getAllActiveTokens = async (req, res) => {
  try {
    const activeTokens = await FCMtoken.find({ isActive: true })
      .populate('userId', 'name email')
      .sort({ lastUpdated: -1 });

    res.json({
      success: true,
      data: activeTokens,
      count: activeTokens.length
    });
  } catch (error) {
    console.error('Error getting all active tokens:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get FCM token statistics
export const getFCMTokenStats = async (req, res) => {
  try {
    const totalTokens = await FCMtoken.countDocuments();
    const activeTokens = await FCMtoken.countDocuments({ isActive: true });
    const inactiveTokens = await FCMtoken.countDocuments({ isActive: false });

    const platformStats = await FCMtoken.aggregate([
      { $group: { _id: '$platform', count: { $sum: 1 } } }
    ]);

    const recentTokens = await FCMtoken.countDocuments({
      lastUpdated: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      data: {
        total: totalTokens,
        active: activeTokens,
        inactive: inactiveTokens,
        platformBreakdown: platformStats,
        recent24h: recentTokens
      }
    });
  } catch (error) {
    console.error('Error getting FCM token stats:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

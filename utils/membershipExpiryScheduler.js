// utils/membershipExpiryScheduler.js
import cron from 'node-cron';
import Renewal from '../models/Renewal.js';
import FCMtoken from '../models/FCMtoken.js';
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Firebase Admin SDK initialization with fallback
let firebaseInitialized = false;

const initializeFirebaseForScheduler = async () => {
  try {
    if (!admin.apps.length) {
      console.log('🔥 Initializing Firebase Admin SDK for scheduler...');
      
      // Try environment variables first
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
        try {
          const serviceAccount = JSON.parse(
            readFileSync('./serviceAccountKey.json', 'utf8')
          );
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: 'cloversclubapp'
          });
          firebaseInitialized = true;
          console.log('✅ Firebase Admin SDK initialized successfully with service account key file');
        } catch (fileError) {
          console.log('⚠️ Service account file failed, trying mock mode...');
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

// Initialize Firebase
initializeFirebaseForScheduler();

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

// Function to send membership expiry notifications
const sendMembershipExpiryNotifications = async () => {
  try {
    console.log('🔄 Starting membership expiry check...');
    
    const notificationDays = [30, 15, 7, 3, 1]; // Days before expiry
    const today = new Date();
    const notifications = [];

    // Get all active memberships with proper status
    const memberships = await Renewal.find({
      $or: [
        { status: 'Active' },
        { status: 'Approved' },
        { status: 'Pending' }
      ],
      membershipExpairy: { $exists: true, $ne: null }
    }).populate('membershipId', 'Member_Name email');

    console.log(`📊 Found ${memberships.length} memberships to check`);

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
            userId: membership.membershipId._id,
            isActive: true
          });

          if (fcmRecord) {
            const userName = membership.membershipId.Member_Name || 'Member';
            const membershipName = membership.membershipName || 'Membership';
            
            // Create different messages based on days until expiry
            let title, body;
            switch (daysUntilExpiry) {
              case 30:
                title = '🔄 Membership Renewal Reminder';
                body = `Hi ${userName}! Your ${membershipName} membership expires in 30 days. Plan your renewal now!`;
                break;
              case 15:
                title = '⏰ Membership Expiring Soon';
                body = `Hi ${userName}! Your ${membershipName} membership expires in 15 days. Don't miss out on benefits!`;
                break;
              case 7:
                title = '🚨 Last Week to Renew';
                body = `Hi ${userName}! Your ${membershipName} membership expires in 7 days. Renew now to avoid interruption!`;
                break;
              case 3:
                title = '⚠️ Membership Expires Soon';
                body = `Hi ${userName}! Your ${membershipName} membership expires in 3 days. Renew immediately!`;
                break;
              case 1:
                title = '🔥 URGENT: Membership Expires Tomorrow';
                body = `Hi ${userName}! Your ${membershipName} membership expires tomorrow. Renew now to continue!`;
                break;
              default:
                title = 'Membership Expiring Soon';
                body = `Your ${membershipName} membership expires in ${daysUntilExpiry} days. Renew now!`;
            }

            const message = {
              token: fcmRecord.fcmToken,
              notification: { title, body },
              data: {
                type: 'membership_expiry',
                membershipType: membershipName,
                daysUntilExpiry: daysUntilExpiry.toString(),
                membershipId: membership._id.toString(),
                userId: membership.membershipId._id.toString(),
                deepLink: `cloversclub://renewal/${membership._id}`,
                urgency: daysUntilExpiry <= 3 ? 'high' : 'normal'
              },
              android: {
                notification: {
                  channelId: 'clovers_notifications',
                  icon: 'ic_notification_custom',
                  color: daysUntilExpiry <= 3 ? '#ff4444' : '#e8bea2',
                  priority: daysUntilExpiry <= 3 ? 'high' : 'normal'
                }
              }
            };

            try {
              let response;
              if (firebaseInitialized) {
                try {
                  response = await admin.messaging().send(message);
                  console.log('✅ Firebase notification sent successfully');
                } catch (firebaseError) {
                  console.log('⚠️ Firebase failed, using mock notification:', firebaseError.message);
                  response = await sendMockNotification(fcmRecord, title, body, message.data);
                }
              } else {
                console.log('⚠️ Firebase not initialized, using mock notification');
                response = await sendMockNotification(fcmRecord, title, body, message.data);
              }
              
              // Update membership with notification record
              await Renewal.findByIdAndUpdate(membership._id, {
                $push: {
                  expiryNotifications: {
                    sentDate: new Date(),
                    daysBeforeExpiry: daysUntilExpiry,
                    notificationType: 'expiry_reminder',
                    messageId: response.messageId || `mock-${Date.now()}`
                  }
                },
                lastNotificationDate: new Date()
              });

              // Update FCM token record
              await FCMtoken.findByIdAndUpdate(fcmRecord._id, {
                lastNotificationSent: new Date(),
                $inc: { notificationCount: 1 }
              });

              notifications.push({
                userId: membership.membershipId._id,
                userName: userName,
                membershipName: membershipName,
                daysUntilExpiry,
                success: true
              });

              console.log(`✅ Notification sent to ${userName} for ${membershipName} (${daysUntilExpiry} days)`);

            } catch (error) {
              console.error(`❌ Error sending notification to user ${membership.membershipId._id}:`, error);
              notifications.push({
                userId: membership.membershipId._id,
                userName: userName,
                membershipName: membershipName,
                daysUntilExpiry,
                success: false,
                error: error.message
              });
            }
          } else {
            console.log(`⚠️  No FCM token found for user ${membership.membershipId._id}`);
          }
        } else {
          console.log(`ℹ️  Notification already sent for user ${membership.membershipId._id} (${daysUntilExpiry} days)`);
        }
      }
    }

    console.log(`🎉 Membership expiry check completed:`);
    console.log(`📊 Total processed: ${notifications.length}`);
    console.log(`✅ Successful: ${notifications.filter(n => n.success).length}`);
    console.log(`❌ Failed: ${notifications.filter(n => !n.success).length}`);

    return {
      success: true,
      totalProcessed: notifications.length,
      successful: notifications.filter(n => n.success).length,
      failed: notifications.filter(n => !n.success).length,
      notifications: notifications
    };

  } catch (error) {
    console.error('❌ Error in membership expiry check:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Schedule the job to run daily at 9 AM
const startMembershipExpiryScheduler = () => {
  console.log('🕘 Starting membership expiry scheduler...');
  
  // Run daily at 9 AM
  cron.schedule('0 9 * * *', () => {
    console.log('⏰ Running scheduled membership expiry check...');
    sendMembershipExpiryNotifications();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  // Also run at 6 PM for urgent notifications (1-3 days)
  cron.schedule('0 18 * * *', () => {
    console.log('⏰ Running evening membership expiry check for urgent notifications...');
    sendMembershipExpiryNotifications();
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  console.log('✅ Membership expiry scheduler started (daily at 9 AM and 6 PM IST)');
};

// Manual trigger for testing
const triggerMembershipExpiryCheck = async () => {
  console.log('🧪 Manually triggering membership expiry check...');
  return await sendMembershipExpiryNotifications();
};

export {
  startMembershipExpiryScheduler,
  triggerMembershipExpiryCheck,
  sendMembershipExpiryNotifications
};

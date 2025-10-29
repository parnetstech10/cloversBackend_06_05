// Firebase Emulator Configuration for Testing
// This allows testing FCM without real Firebase credentials

import admin from 'firebase-admin';

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV !== 'production';

let firebaseInitialized = false;
let useEmulator = false;

if (isDevelopment) {
  try {
    // Try to initialize with emulator
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: 'cloversclubapp'
      });
      
      // Set up emulator endpoints
      process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
      process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';
      
      firebaseInitialized = true;
      useEmulator = true;
      console.log('✅ Firebase Admin SDK initialized with emulator');
    }
  } catch (error) {
    console.log('⚠️ Firebase emulator not available, using mock mode');
    firebaseInitialized = false;
    useEmulator = false;
  }
} else {
  // Production mode - try real Firebase
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        projectId: 'cloversclubapp'
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK initialized for production');
    }
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error.message);
    firebaseInitialized = false;
  }
}

// Mock FCM function for testing
const mockSendNotification = async (message) => {
  console.log('🧪 MOCK FCM Notification:', {
    token: message.token,
    title: message.notification?.title,
    body: message.notification?.body,
    data: message.data
  });
  
  return {
    success: true,
    messageId: `mock-${Date.now()}`,
    mock: true
  };
};

export { firebaseInitialized, useEmulator, mockSendNotification };











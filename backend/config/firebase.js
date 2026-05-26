// Firebase Admin SDK configuration (optional — for push notifications)
// If you don't need push notifications, this module will gracefully fail

let messaging = null;

try {
  const admin = require('firebase-admin');
  const serviceAccount = require('./firebase-service-account.json');
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  
  messaging = admin.messaging();
  console.log('✅ Firebase Admin initialized');
} catch (err) {
  console.warn('⚠️  Firebase not configured — push notifications disabled');
  console.warn('   To enable: Add firebase-service-account.json to config/');
  // Create a mock messaging object so the app doesn't crash
  messaging = {
    send: async () => { throw new Error('Firebase not configured'); }
  };
}

module.exports = { messaging };

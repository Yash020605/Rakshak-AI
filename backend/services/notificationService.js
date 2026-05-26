const { messaging } = require('../config/firebase');

/**
 * Send push notification to a device token
 */
async function sendPushNotification(token, title, body, data = {}) {
  if (!token) return null;
  try {
    const result = await messaging.send({
      token,
      notification: { title, body },
      data: { ...data },
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    });
    return { success: true, messageId: result };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { sendPushNotification };

const Responder = require('../models/Responder');

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Find active responders within radius
 * @param {number} latitude - User's latitude
 * @param {number} longitude - User's longitude
 * @param {string} emergencyType - Type of emergency (medical/fire/police)
 * @param {number} radiusKm - Search radius in kilometers (default 5km)
 * @returns {Array} Array of nearby responders
 */
async function findNearbyResponders(latitude, longitude, emergencyType, radiusKm = 5) {
  try {
    // Get all active responders
    const allResponders = await Responder.find({
      status: 'active',
      $or: [
        { type: emergencyType },
        { type: 'all' }
      ]
    });

    // Filter by distance
    const nearbyResponders = allResponders
      .map(responder => ({
        ...responder.toObject(),
        distance: calculateDistance(latitude, longitude, responder.latitude, responder.longitude)
      }))
      .filter(responder => responder.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance); // Sort by distance

    return nearbyResponders;
  } catch (err) {
    console.error('Error finding nearby responders:', err);
    return [];
  }
}

/**
 * Notify responders via WebSocket
 * @param {Object} io - Socket.IO instance
 * @param {Array} responders - Array of responder objects
 * @param {Object} alertData - Alert information
 */
function notifyResponders(io, responders, alertData) {
  responders.forEach(responder => {
    if (responder.socketId) {
      // Send to specific responder's socket
      io.to(responder.socketId).emit('new-alert', {
        alertId: alertData.alertId,
        type: alertData.type,
        latitude: alertData.latitude,
        longitude: alertData.longitude,
        userName: alertData.userName,
        bloodGroup: alertData.bloodGroup,
        medicalConditions: alertData.medicalConditions,
        distance: responder.distance,
        timestamp: alertData.timestamp,
      });
    }
  });

  // Also broadcast to responder dashboard room
  io.to('responder-dashboard').emit('new-alert', {
    alertId: alertData.alertId,
    type: alertData.type,
    latitude: alertData.latitude,
    longitude: alertData.longitude,
    userName: alertData.userName,
    bloodGroup: alertData.bloodGroup,
    medicalConditions: alertData.medicalConditions,
    timestamp: alertData.timestamp,
  });
}

module.exports = {
  findNearbyResponders,
  notifyResponders,
  calculateDistance,
};

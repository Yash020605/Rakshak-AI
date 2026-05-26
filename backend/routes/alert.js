const express = require('express');
const { body, validationResult } = require('express-validator');
const Alert = require('../models/Alert');
const Profile = require('../models/Profile');
const { sendSOSAlerts } = require('../services/smsService');
const { findNearestService } = require('../services/locationService');
const { findNearbyResponders, notifyResponders } = require('../services/responderService');
const { cache } = require('../config/cache');

const router = express.Router();

const validateAlert = [
  body('userId').notEmpty(),
  body('type').isIn(['medical', 'fire', 'police']),
  body('latitude').isFloat({ min: -90, max: 90 }),
  body('longitude').isFloat({ min: -180, max: 180 }),
];

// POST /api/alert/sos - DUAL-ROUTING IMPLEMENTATION
router.post('/sos', validateAlert, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { userId, type, latitude, longitude } = req.body;

  try {
    const profile = await Profile.findOne({ userId });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    // Save alert to MongoDB with user profile snapshot
    const alert = await Alert.create({
      userId,
      type,
      latitude,
      longitude,
      userName: profile.name,
      bloodGroup: profile.bloodGroup,
      medicalConditions: profile.medicalConditions,
      photoUrl: profile.photoUrl || null,
      prescriptions: profile.prescriptions || [],
    });
    const alertId = alert._id.toString();

    // Store live location in cache
    cache.set(`live:${userId}`, { latitude, longitude, updatedAt: Date.now() });

    // Emit to user's personal channel
    req.app.get('io')?.emit(`alert:${userId}`, { alertId, type, latitude, longitude });

    // Respond immediately
    res.json({ success: true, alertId, nearestService: null, smsResults: [] });

    // ============================================
    // DUAL-ROUTING SYSTEM - SIMULTANEOUS ACTIONS
    // ============================================

    // ACTION A: FAMILY ROUTE - SMS to emergency contacts
    sendSOSAlerts(
      { id: alertId, type, latitude, longitude, timestamp: alert.createdAt },
      profile
    ).then(results => {
      console.log('✅ SMS sent to family:', results.length, 'contacts');
    }).catch(e => console.warn('⚠️ SMS error:', e.message));

    // ACTION B: RESPONDER ROUTE - Alert nearby responders
    findNearbyResponders(latitude, longitude, type, 5).then(responders => {
      if (responders.length > 0) {
        console.log(`✅ Found ${responders.length} nearby responders`);
        notifyResponders(req.app.get('io'), responders, {
          alertId,
          type,
          latitude,
          longitude,
          userName: profile.name,
          bloodGroup: profile.bloodGroup,
          medicalConditions: profile.medicalConditions,
          photoUrl: profile.photoUrl || null,
          prescriptions: profile.prescriptions || [],
          timestamp: alert.createdAt,
        });
      } else {
        console.log('⚠️ No active responders found within 5km');
      }
    }).catch(e => console.warn('⚠️ Responder notification error:', e.message));

    // Background: Find nearest service (OpenStreetMap)
    findNearestService(latitude, longitude, type)
      .then(svc => req.app.get('io')?.emit(`nearest:${userId}`, svc))
      .catch(e => console.warn('⚠️ Overpass error:', e.message));

  } catch (err) {
    console.error('❌ SOS error:', err);
    res.status(500).json({ error: 'Failed to process SOS alert' });
  }
});

// POST /api/alert/sms — send SMS directly via Twilio (called from mobile)
router.post('/sms', async (req, res) => {
  const { type, latitude, longitude, profile } = req.body;
  if (!profile || !type) return res.status(400).json({ error: 'Missing fields' });

  const label = { medical: '🚑 MEDICAL EMERGENCY', fire: '🔥 FIRE EMERGENCY', police: '🚓 CRIME/THREAT EMERGENCY' }[type] || 'EMERGENCY';
  const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
  const message =
    `${label}\nPerson: ${profile.name}\nBlood Group: ${profile.bloodGroup || 'N/A'}\n` +
    (profile.medicalConditions ? `Medical: ${profile.medicalConditions}\n` : '') +
    `Location: ${mapsLink}\nSent via Rakshak AI`;

  const contacts = (profile.emergencyContacts || []).filter(c => c.phone);
  if (!contacts.length) return res.json({ success: true, sent: 0 });

  const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  await Promise.allSettled(
    contacts.map((c) =>
      twilio.messages.create({ body: message, from: process.env.TWILIO_PHONE_NUMBER, to: c.phone })
    )
  );

  res.json({ success: true, sent: contacts.length });
});

// GET /api/alert/:alertId
router.get('/:alertId', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.alertId);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alert/:alertId/resolve
router.patch('/:alertId/resolve', async (req, res) => {
  try {
    await Alert.findByIdAndUpdate(req.params.alertId, { status: 'resolved' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alert/:alertId/dispatch - Responder accepts alert
router.patch('/:alertId/dispatch', async (req, res) => {
  const { responderId, responderName } = req.body;
  
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.alertId,
      {
        status: 'dispatched',
        responderId,
        responderName,
        dispatchedAt: new Date(),
      },
      { new: true }
    );

    if (!alert) return res.status(404).json({ error: 'Alert not found' });

    // Notify user that help is on the way — emit on both userId and alertId channels
    const io = req.app.get('io');
    io?.to(`user:${alert.userId}`).emit(`alert-dispatched:${alert.userId}`, {
      alertId: alert._id,
      responderName,
      status: 'dispatched',
      message: `Help is on the way. ${responderName} dispatched.`,
    });
    // Also emit on alertId channel so MapScreen can listen by alertId
    io?.to(`user:${alert.userId}`).emit(`alert-dispatched:${alert._id}`, {
      alertId: alert._id,
      responderName,
      status: 'dispatched',
      message: `Help is on the way. ${responderName} dispatched.`,
    });

    // Notify family via their tracking channels
    req.app.get('io')?.emit(`alert-status:${alert._id}`, {
      status: 'dispatched',
      responderName,
      dispatchedAt: alert.dispatchedAt,
    });

    // Broadcast to all responder dashboards
    req.app.get('io')?.to('responder-dashboard').emit('alert-accepted', {
      alertId: alert._id,
      responderName,
    });

    res.json({ success: true, alert });
  } catch (err) {
    console.error('Dispatch error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

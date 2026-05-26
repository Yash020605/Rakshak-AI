const express = require('express');
const { body, validationResult } = require('express-validator');
const Responder = require('../models/Responder');
const Alert = require('../models/Alert');

const router = express.Router();

// GET /api/responder - Get all responders
router.get('/', async (req, res) => {
  try {
    const responders = await Responder.find();
    res.json(responders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/responder/alerts/active - Get all active/dispatched alerts for dashboard
// IMPORTANT: Must be defined BEFORE /:id to prevent Express matching "alerts" as a Mongo ID
router.get('/alerts/active', async (req, res) => {
  try {
    const alerts = await Alert.find({ status: { $in: ['active', 'dispatched'] } })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/responder - Register new responder
router.post(
  '/',
  [
    body('name').notEmpty(),
    body('type').isIn(['medical', 'fire', 'police', 'all']),
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const responder = await Responder.create(req.body);
      res.json({ success: true, responder });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// PATCH /api/responder/:id/status - Update responder status
router.patch('/:id/status', async (req, res) => {
  const { status, socketId } = req.body;

  try {
    const update = { status, lastActive: new Date() };
    if (socketId) update.socketId = socketId;

    const responder = await Responder.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!responder) return res.status(404).json({ error: 'Responder not found' });
    res.json({ success: true, responder });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/responder/:id - Remove responder
router.delete('/:id', async (req, res) => {
  try {
    await Responder.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

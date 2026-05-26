const express = require('express');
const multer  = require('multer');
const path    = require('path');
const { body, validationResult } = require('express-validator');
const Profile = require('../models/Profile');

const router = express.Router();

// ─── Multer config for profile uploads ───────────────────────────────────────
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    const allowed = /jpeg|jpg|png|gif|webp|pdf/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) ||
               allowed.test(file.mimetype);
    cb(ok ? null : new Error('Only images and PDFs are allowed'), ok);
  },
});

// ─── GET /api/profile/:userId ─────────────────────────────────────────────────
router.get('/:userId', async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/profile — upsert core profile fields ──────────────────────────
router.post(
  '/',
  [body('userId').notEmpty(), body('name').notEmpty(), body('emergencyContacts').isArray()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {
      userId, name, bloodGroup, medicalConditions,
      allergies, medications, address,
      emergencyContacts, photoUrl, prescriptions,
    } = req.body;

    try {
      const update = {
        name, bloodGroup, medicalConditions,
        allergies, medications, address,
        emergencyContacts,
      };
      // Only update photo/prescriptions if explicitly provided
      if (photoUrl !== undefined) update.photoUrl = photoUrl;
      if (prescriptions !== undefined) update.prescriptions = prescriptions;

      const profile = await Profile.findOneAndUpdate(
        { userId },
        update,
        { upsert: true, new: true, runValidators: true }
      );
      res.json({ success: true, profile });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── POST /api/profile/:userId/photo — upload profile photo ──────────────────
router.post('/:userId/photo', upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  try {
    const profile = await Profile.findOneAndUpdate(
      { userId: req.params.userId },
      { photoUrl: fileUrl },
      { upsert: true, new: true }
    );
    res.json({ success: true, photoUrl: fileUrl, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/profile/:userId/prescription — upload a prescription ───────────
router.post('/:userId/prescription', upload.single('prescription'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const fileUrl  = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  const label    = req.body.name || `Prescription ${Date.now()}`;

  try {
    const profile = await Profile.findOneAndUpdate(
      { userId: req.params.userId },
      { $push: { prescriptions: { name: label, url: fileUrl, uploadedAt: new Date() } } },
      { upsert: true, new: true }
    );
    res.json({
      success: true,
      prescription: { name: label, url: fileUrl },
      profile,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/profile/:userId/prescription/:index ─────────────────────────
router.delete('/:userId/prescription/:index', async (req, res) => {
  try {
    const profile = await Profile.findOne({ userId: req.params.userId });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const idx = parseInt(req.params.index, 10);
    if (isNaN(idx) || idx < 0 || idx >= profile.prescriptions.length)
      return res.status(400).json({ error: 'Invalid prescription index' });

    profile.prescriptions.splice(idx, 1);
    await profile.save();
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

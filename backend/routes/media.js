const express = require('express');
const multer = require('multer');
const path = require('path');
const Alert = require('../models/Alert');
const Media = require('../models/Media');

const router = express.Router();

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|mp4|mov|mp3|aac|wav/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Unsupported file type'), ok);
  },
});

// POST /api/media/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const { alertId, userId } = req.body;
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  try {
    const media = await Media.create({
      alertId: alertId || null,
      userId: userId || null,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      url: fileUrl,
    });

    if (alertId) {
      await Alert.findByIdAndUpdate(alertId, { $push: { mediaUrls: fileUrl } });
    }

    res.json({ success: true, id: media._id, url: fileUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

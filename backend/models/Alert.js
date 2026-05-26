const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  type: { type: String, enum: ['medical', 'fire', 'police'], required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  status: { type: String, enum: ['active', 'dispatched', 'resolved'], default: 'active' },
  mediaUrls: [String],
  // Responder tracking — responderId is a plain string to support both
  // registered responders (ObjectId) and ad-hoc dashboard dispatches
  responderId: { type: String },
  responderName: { type: String },
  dispatchedAt: { type: Date },
  // User profile snapshot (for quick access)
  userName: { type: String },
  bloodGroup: { type: String },
  medicalConditions: { type: String },
  photoUrl: { type: String, default: null },
  prescriptions: [{ name: String, url: String }],
}, { timestamps: true });

module.exports = mongoose.model('Alert', alertSchema);

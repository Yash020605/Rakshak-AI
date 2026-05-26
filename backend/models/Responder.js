const mongoose = require('mongoose');

const responderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['medical', 'fire', 'police', 'all'], default: 'all' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  status: { type: String, enum: ['active', 'busy', 'offline'], default: 'active' },
  phone: { type: String },
  email: { type: String },
  organization: { type: String }, // Hospital name, Fire Station, Police Station
  socketId: { type: String }, // Current WebSocket connection ID
  lastActive: { type: Date, default: Date.now },
  activeAlerts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Alert' }],
}, { timestamps: true });

// Index for geospatial queries
responderSchema.index({ latitude: 1, longitude: 1 });

module.exports = mongoose.model('Responder', responderSchema);

const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert', index: true },
  userId: { type: String, index: true },
  filename: { type: String, required: true },
  mimetype: { type: String, required: true },
  url: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Media', mediaSchema);

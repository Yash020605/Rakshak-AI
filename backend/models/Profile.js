const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  bloodGroup: String,
  medicalConditions: String,
  allergies: String,
  medications: String,
  address: String,
  emergencyContacts: [{ name: String, phone: String }],
  // Profile photo — URL of uploaded image
  photoUrl: { type: String, default: null },
  // Medical prescriptions — array of { name, url, uploadedAt }
  prescriptions: [
    {
      name: { type: String, default: 'Prescription' },
      url:  { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'supervisor'], default: 'user' },
  faceData: { type: String }, // Base64 encoded face image
  voiceData: { type: String }, // Base64 encoded voice sample
  fingerprintData: { type: String }, // Placeholder for fingerprint
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);

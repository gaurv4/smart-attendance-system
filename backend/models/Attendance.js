const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  method: { type: String, enum: ['fingerprint', 'face', 'voice'], required: true },
  timestamp: { type: Date, default: Date.now },
  status: { type: String, enum: ['present', 'absent'], default: 'present' },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String }
  }, // Optional GPS location with coordinates and address
});

module.exports = mongoose.model('Attendance', attendanceSchema);

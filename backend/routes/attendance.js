const express = require('express');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const auth = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();

// Submit Attendance
router.post('/submit', auth, async (req, res) => {
  const { method, biometricData, location } = req.body; // biometricData could be fingerprint hash, face image, voice sample, location optional
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Basic biometric validation (simplified for demo purposes)
    let isValid = false;
    if (method === 'fingerprint') {
      // For demo, accept fingerprint authentication if provided
      isValid = biometricData === 'fingerprint_authenticated';
    } else if (method === 'face') {
      // For demo, accept face data if provided
      isValid = biometricData;
    } else if (method === 'voice') {
      // For demo, accept voice data if provided
      isValid = biometricData;
    }

    if (!isValid) return res.status(400).json({ message: 'Biometric verification failed' });

    const attendance = new Attendance({ userId: req.user.id, method, location });
    await attendance.save();

    res.json({ message: 'Attendance submitted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get User Attendance Records
router.get('/user/:id', auth, async (req, res) => {
  try {
    const records = await Attendance.find({ userId: req.params.id }).populate('userId', 'name email').sort({ timestamp: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get All Attendance Records (for supervisor)
router.get('/all', auth, async (req, res) => {
  if (req.user.role !== 'supervisor') return res.status(403).json({ message: 'Access denied' });
  try {
    const records = await Attendance.find().populate('userId', 'name email').sort({ timestamp: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  type: { type: String, enum: ['register', 'reset'], default: 'register' },
  verified: { type: Boolean, default: false },
  userData: {
    name: String,
    email: String,
    password: String,
  },
  createdAt: { type: Date, default: Date.now, expires: 600 }, // auto-delete after 10 min
});

module.exports = mongoose.model('OTP', otpSchema);
const express = require('express');
const {
  sendRegisterOTP,
  verifyOTPAndRegister,
  resendOTP,
  sendForgotPasswordOTP,
  verifyForgotPasswordOTP,
  resetPassword,
  login,
  getProfile,
} = require('../controllers/authController');
const protect = require('../middleware/authMiddleware');
const { googleLogin } = require('../controllers/googleAuthController');

const router = express.Router();

// ⭐ Debug log (check in Render logs)
console.log("✅ Auth Routes Loaded");

// Register with OTP
router.post('/register/send-otp', sendRegisterOTP);
router.post('/register/verify-otp', verifyOTPAndRegister);
router.post('/register/resend-otp', resendOTP);

// Forgot Password
router.post('/forgot-password/send-otp', sendForgotPasswordOTP);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOTP);
router.post('/forgot-password/reset', resetPassword);

// Login & profile
router.post('/login', login);
router.get('/profile', protect, getProfile);

// Google login
router.post('/google', googleLogin);

const { phoneLogin } = require('../controllers/phoneAuthController');
router.post('/phone-login', phoneLogin);
module.exports = router;
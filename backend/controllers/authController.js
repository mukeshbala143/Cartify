const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendOTPEmail, sendPasswordResetEmail } = require('../utils/emailService');

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const generateToken = (user) =>
  jwt.sign({ id: user._id, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ── STEP 1: Send OTP (Register) ───────────────────────────────────
exports.sendRegisterOTP = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: 'Email already registered. Please login.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();

    await OTP.deleteMany({ email, type: 'register' });
    await OTP.create({ email, otp, type: 'register', userData: { name, email, password: hashedPassword } });

    await sendOTPEmail(email, otp, name);
    res.json({ success: true, message: `OTP sent to ${email}` });
  } catch (error) {
    console.error('Send OTP error:', error.message);
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
};

// ── STEP 2: Verify OTP & Create Account ──────────────────────────
exports.verifyOTPAndRegister = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: 'Email and OTP are required' });

    const otpRecord = await OTP.findOne({ email, type: 'register' });
    if (!otpRecord)
      return res.status(400).json({ message: 'OTP expired or not found. Please register again.' });
    if (otpRecord.otp !== otp)
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });

    const { name, password } = otpRecord.userData;
    const user = await User.create({ name, email, password });
    await OTP.deleteMany({ email, type: 'register' });

    res.status(201).json({ success: true, message: 'Account created successfully!', user: { _id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Verify OTP error:', error.message);
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
};

// ── RESEND OTP (Register) ─────────────────────────────────────────
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const otpRecord = await OTP.findOne({ email, type: 'register' });
    if (!otpRecord)
      return res.status(400).json({ message: 'Session expired. Please register again.' });

    const otp = generateOTP();
    otpRecord.otp = otp;
    otpRecord.createdAt = new Date();
    await otpRecord.save();

    await sendOTPEmail(email, otp, otpRecord.userData?.name);
    res.json({ success: true, message: 'OTP resent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to resend OTP' });
  }
};

// ── FORGOT PASSWORD: Send OTP ─────────────────────────────────────
exports.sendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email)
      return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: 'No account found with this email.' });

    // Block Google-only accounts
    if (user.googleId && user.password.startsWith('google_'))
      return res.status(400).json({ message: 'This account uses Google Sign-In. Please login with Google.' });

    const otp = generateOTP();
    await OTP.deleteMany({ email, type: 'reset' });
    await OTP.create({ email, otp, type: 'reset', userData: { name: user.name } });

    await sendPasswordResetEmail(email, otp, user.name);
    res.json({ success: true, message: `Password reset OTP sent to ${email}` });
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ message: 'Failed to send OTP', error: error.message });
  }
};

// ── FORGOT PASSWORD: Verify OTP ───────────────────────────────────
exports.verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpRecord = await OTP.findOne({ email, type: 'reset' });

    if (!otpRecord)
      return res.status(400).json({ message: 'OTP expired or not found. Please try again.' });
    if (otpRecord.otp !== otp)
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });

    // Mark OTP as verified (don't delete yet, need it for reset step)
    otpRecord.verified = true;
    await otpRecord.save();

    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
};

// ── FORGOT PASSWORD: Reset Password ──────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: 'All fields required' });

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const otpRecord = await OTP.findOne({ email, type: 'reset', verified: true });
    if (!otpRecord || otpRecord.otp !== otp)
      return res.status(400).json({ message: 'Invalid or expired session. Please start again.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });
    await OTP.deleteMany({ email, type: 'reset' });

    res.json({ success: true, message: 'Password reset successfully! Please login.' });
  } catch (error) {
    res.status(500).json({ message: 'Reset failed', error: error.message });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      success: true,
      token: generateToken(user),
      user: { _id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin, isSeller: user.isSeller },
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// ── GET PROFILE ───────────────────────────────────────────────────
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
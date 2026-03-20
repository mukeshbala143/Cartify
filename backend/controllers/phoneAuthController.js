const admin = require('firebase-admin');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

exports.phoneLogin = async (req, res) => {
  try {
    const { firebaseToken, phone } = req.body;
    if (!firebaseToken || !phone) {
      return res.status(400).json({ message: 'Token and phone required' });
    }

    // Verify Firebase token
    const decoded = await admin.auth().verifyIdToken(firebaseToken);
    if (!decoded.phone_number) {
      return res.status(400).json({ message: 'Invalid phone token' });
    }

    // Find or create user
    let user = await User.findOne({ phone: decoded.phone_number });

    if (!user) {
      // New user — create account
      user = await User.create({
        name: `User${Date.now().toString().slice(-4)}`,
        phone: decoded.phone_number,
        firebaseUid: decoded.uid,
        password: `firebase_${decoded.uid}`,
      });
    } else {
      // Update firebaseUid if not set
      if (!user.firebaseUid) {
        user.firebaseUid = decoded.uid;
        await user.save();
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        isAdmin: user.isAdmin,
        isSeller: user.isSeller,
        sellerInfo: user.sellerInfo,
      }
    });
  } catch (err) {
    console.error('Phone login error:', err);
    res.status(401).json({ message: 'Authentication failed: ' + err.message });
  }
};

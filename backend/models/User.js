const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  isSeller: { type: Boolean, default: false },
  googleId: { type: String },
  avatar: { type: String },
  sellerInfo: {
    shopName: { type: String },
    shopDescription: { type: String },
    phone: { type: String },
    countryCode: { type: String, default: '+91' },
    approved: { type: Boolean, default: false },
  },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
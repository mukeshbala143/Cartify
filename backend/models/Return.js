const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  user:  { type: mongoose.Schema.Types.ObjectId, ref: "User",  required: true },

  type: { type: String, enum: ["Refund", "Exchange"], required: true },

  items: [{
    product:       { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    qty:           { type: Number, required: true },
    exchangeSize:  { type: String },
    exchangeColor: { type: String },
  }],

  reason:      { type: String, required: true },
  description: { type: String },

  status: {
    type: String,
    enum: [
      "Requested",
      "Approved",
      "Rejected",
      "Pickup Scheduled",
      "Picked Up",
      "Received by Company",
      "Refund Processed",
      "Exchange Processing",
      "Exchange Shipped",
      "Exchange Delivered",
    ],
    default: "Requested",
  },

  adminNote:    { type: String },

  // Pickup details
  pickupDate:     { type: String },  // "2026-03-10"
  pickupTimeSlot: { type: String },  // "10:00 AM - 12:00 PM"

  // Refund
  refundAmount: { type: Number },
  refundId:     { type: String },

  // Exchange shipping
  exchangeTrackingNumber: { type: String },

  statusHistory: [{
    status:    { type: String },
    message:   { type: String },
    timestamp: { type: Date, default: Date.now },
  }],

}, { timestamps: true });

module.exports = mongoose.model("Return", returnSchema);
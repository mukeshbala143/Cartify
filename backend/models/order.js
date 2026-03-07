const mongoose = require("mongoose");

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  message: { type: String },
  timestamp: { type: Date, default: Date.now },
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
  }],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["Razorpay", "COD"], default: "Razorpay" },
  paymentStatus: { type: String, enum: ["Paid", "Unpaid"], default: "Unpaid" },
  shippingAddress: {
    name: String, phone: String, line1: String,
    line2: String, city: String, state: String, pincode: String,
  },
  status: {
    type: String,
    enum: ["Pending", "Paid", "Processing", "Shipped", "Delivered", "Cancelled"],
    default: "Pending",
  },
  statusHistory: [statusHistorySchema],
  trackingNumber: { type: String },
  estimatedDelivery: { type: String },
  paymentId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
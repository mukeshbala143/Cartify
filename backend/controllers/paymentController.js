const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const Order = require("../models/order");

exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount, orderId } = req.body;
    const options = { amount: amount * 100, currency: "INR", receipt: orderId };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: "Payment error" });
  }
};

exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    await Order.findByIdAndUpdate(orderId, { status: "Paid", paymentId: razorpay_payment_id });
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
};

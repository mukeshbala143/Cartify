const Return = require("../models/Return");
const Order  = require("../models/order");

const getRazorpay = () => {
  const Razorpay = require("razorpay");
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const RETURN_WINDOW_DAYS = 10;

// ── USER: Request Return/Exchange ─────────────────────────────────
exports.createReturn = async (req, res) => {
  try {
    const { orderId, type, items, reason, description } = req.body;

    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status !== "Delivered")
      return res.status(400).json({ message: "Only delivered orders can be returned" });

    const deliveredEntry = [...order.statusHistory].reverse().find(h => h.status === "Delivered");
    if (deliveredEntry) {
      const daysSince = (Date.now() - new Date(deliveredEntry.timestamp)) / (1000 * 60 * 60 * 24);
      if (daysSince > RETURN_WINDOW_DAYS)
        return res.status(400).json({ message: `Return window of ${RETURN_WINDOW_DAYS} days has expired` });
    }

    const existing = await Return.findOne({ order: orderId, status: { $nin: ["Rejected"] } });
    if (existing)
      return res.status(400).json({ message: "A return request already exists for this order" });

    const returnReq = await Return.create({
      order: orderId,
      user:  req.user._id,
      type,
      items,
      reason,
      description,
      statusHistory: [{ status: "Requested", message: `${type} request submitted by customer.` }],
    });

    res.status(201).json({ success: true, return: returnReq });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── USER: Get My Returns ──────────────────────────────────────────
exports.getMyReturns = async (req, res) => {
  try {
    const returns = await Return.find({ user: req.user._id })
      .populate("order")
      .populate("items.product", "name images")
      .sort({ createdAt: -1 });
    res.json({ returns });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── ADMIN: Get All Returns ────────────────────────────────────────
exports.getAllReturns = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status && status !== "All" ? { status } : {};
    const returns = await Return.find(query)
      .populate("user", "name email")
      .populate("order")
      .populate("items.product", "name images price")
      .sort({ createdAt: -1 });
    res.json({ returns });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── ADMIN: Update Return Status ───────────────────────────────────
exports.updateReturnStatus = async (req, res) => {
  try {
    const {
      status,
      adminNote,
      pickupDate,
      pickupTimeSlot,
      refundAmount,
      exchangeTrackingNumber,
    } = req.body;

    const returnReq = await Return.findById(req.params.id)
      .populate("order")
      .populate("user", "name email");

    if (!returnReq) return res.status(404).json({ message: "Return not found" });

    returnReq.status = status;
    if (adminNote)               returnReq.adminNote   = adminNote;
    if (pickupDate)              returnReq.pickupDate  = pickupDate;
    if (pickupTimeSlot)          returnReq.pickupTimeSlot = pickupTimeSlot;
    if (refundAmount !== undefined && refundAmount !== '') returnReq.refundAmount = refundAmount;
    if (exchangeTrackingNumber)  returnReq.exchangeTrackingNumber = exchangeTrackingNumber;

    // Build history message
    const msgMap = {
      Approved:              "Your return request has been approved.",
      Rejected:              adminNote || "Your return request was rejected.",
      "Pickup Scheduled":    `Pickup scheduled on ${pickupDate}${pickupTimeSlot ? ` (${pickupTimeSlot})` : ''}.`,
      "Picked Up":           "Your item has been picked up by our agent.",
      "Received by Company": "We have received your returned item.",
      "Refund Processed":    `Refund of ₹${refundAmount} has been processed.`,
      "Exchange Processing": "Your exchange item is being prepared.",
      "Exchange Shipped":    `Your exchange item has been shipped. Tracking: ${exchangeTrackingNumber || 'N/A'}.`,
      "Exchange Delivered":  "Your exchange item has been delivered!",
    };
    returnReq.statusHistory.push({
      status,
      message: msgMap[status] || adminNote || `Status updated to ${status}`,
    });

    // Auto Razorpay refund
    if (status === "Refund Processed" && returnReq.order?.paymentMethod === "Razorpay" && returnReq.order?.paymentId) {
      try {
        const razorpay = getRazorpay();
        const amountPaise = (refundAmount || returnReq.order.totalAmount) * 100;
        const refund = await razorpay.payments.refund(returnReq.order.paymentId, {
          amount: amountPaise,
          notes: { reason: returnReq.reason, returnId: returnReq._id.toString() },
        });
        returnReq.refundId = refund.id;
      } catch (rzErr) {
        console.error("Razorpay refund error:", rzErr.message);
      }
    }

    await returnReq.save();
    res.json({ success: true, return: returnReq });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
const Order = require("../models/order");
const User = require("../models/User");
const { sendOrderStatusEmail, sendEmail } = require("../utils/emailService");

// ── Helpers ──────────────────────────────────────────────────────
const getEstimatedDelivery = (fromDate = new Date()) => {
  const date = new Date(fromDate);
  let added = 0;
  while (added < 7) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

const STATUS_MESSAGES = {
  Pending:    "Your order has been placed successfully.",
  Paid:       "Payment confirmed. Your order is being prepared.",
  Processing: "Your order is being packed and prepared for dispatch.",
  Shipped:    "Your order is on the way!",
  Delivered:  "Your order has been delivered. Enjoy your purchase!",
  Cancelled:  "Your order has been cancelled.",
};

// ── Place Order ───────────────────────────────────────────────────
exports.placeOrder = async (req, res) => {
  try {
    const { items, totalAmount, paymentMethod, shippingAddress, paymentId } = req.body;
    const estimatedDelivery = getEstimatedDelivery();

    const order = await Order.create({
      user: req.user._id,
      items,
      totalAmount,
      paymentMethod,
      shippingAddress,
      paymentId,
      estimatedDelivery,
      status: "Pending",
      statusHistory: [{ status: "Pending", message: STATUS_MESSAGES.Pending }],
    });

    try {
      const user = await User.findById(req.user._id);
      await sendOrderStatusEmail(user.email, user.name, order, "Pending");
    } catch (emailErr) {
      console.error("Order email error:", emailErr.message);
    }

    res.status(201).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: "Failed to place order", error: error.message });
  }
};

// ── Get My Orders ─────────────────────────────────────────────────
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.product", "name images price")
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// ── Cancel Order (User) ───────────────────────────────────────────
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (["Shipped", "Delivered", "Cancelled"].includes(order.status))
      return res.status(400).json({ message: `Cannot cancel order in ${order.status} status` });

    order.status = "Cancelled";
    order.statusHistory.push({ status: "Cancelled", message: "Order cancelled by customer." });
    await order.save();

    try {
      const user = await User.findById(req.user._id);
      await sendOrderStatusEmail(user.email, user.name, order, "Cancelled");
    } catch (e) {}

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: "Cancel failed", error: error.message });
  }
};

// ── Update Shipping Address (User) ────────────────────────────────
exports.updateShippingAddress = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (["Shipped", "Delivered", "Cancelled"].includes(order.status))
      return res.status(400).json({ message: "Cannot change address after order is shipped" });

    order.shippingAddress = req.body.shippingAddress;
    order.statusHistory.push({ status: order.status, message: "Shipping address updated by customer." });
    await order.save();
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

// ── ADMIN: Get All Orders ─────────────────────────────────────────
exports.getAllOrders = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && status !== "All") query.status = status;

    let orders = await Order.find(query)
      .populate("user", "name email")
      .populate("items.product", "name images price")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    if (search) {
      const s = search.toLowerCase();
      orders = orders.filter(o =>
        o._id.toString().includes(s) ||
        o.user?.name?.toLowerCase().includes(s) ||
        o.user?.email?.toLowerCase().includes(s)
      );
    }

    const total = await Order.countDocuments(query);
    res.json({ orders, total, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// ── ADMIN: Update Order Status ────────────────────────────────────
exports.adminUpdateOrderStatus = async (req, res) => {
  try {
    const { status, trackingNumber, message } = req.body;
    const order = await Order.findById(req.params.id).populate("user", "name email");

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "Cancelled")
      return res.status(400).json({ message: "Cannot update a cancelled order" });

    const prevStatus = order.status;
    order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;

    if (status === "Shipped") {
      order.estimatedDelivery = getEstimatedDelivery();
    }

    const historyMsg = message || STATUS_MESSAGES[status] || `Status updated to ${status}`;
    order.statusHistory.push({ status, message: historyMsg });
    await order.save();

    if (order.user?.email && prevStatus !== status) {
      try {
        await sendOrderStatusEmail(order.user.email, order.user.name, order, status);
      } catch (emailErr) {
        console.error("Status email error:", emailErr.message);
      }
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

// ── ADMIN: Update COD Payment Status ─────────────────────────────
exports.updateCodPaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.paymentMethod !== "COD")
      return res.status(400).json({ message: "Only COD orders can be updated" });

    order.paymentStatus = paymentStatus;
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

// ── ADMIN: Get Order Stats ────────────────────────────────────────
exports.getOrderStats = async (req, res) => {
  try {
    // Order status wise counts
    const stats = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$totalAmount" } } }
    ]);

    const total = await Order.countDocuments();

    const totalRevenueData = await Order.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    // Paid = Razorpay (non-cancelled) + COD marked Paid
    const razorpayPaid = await Order.countDocuments({
      paymentMethod: "Razorpay",
      status: { $ne: "Cancelled" },
    });
    const codPaid = await Order.countDocuments({
      paymentMethod: "COD",
      paymentStatus: "Paid",
    });
    // Unpaid = COD not marked Paid and not cancelled
    const codUnpaid = await Order.countDocuments({
      paymentMethod: "COD",
      paymentStatus: { $ne: "Paid" },
      status: { $ne: "Cancelled" },
    });

    res.json({
      stats,
      total,
      totalRevenue: totalRevenueData[0]?.total || 0,
      paidCount: razorpayPaid + codPaid,
      unpaidCount: codUnpaid,
    });
  } catch (error) {
    res.status(500).json({ message: "Stats failed" });
  }
};
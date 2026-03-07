const express = require("express");
const {
  placeOrder,
  getMyOrders,
  cancelOrder,
  updateShippingAddress,
  getAllOrders,
  adminUpdateOrderStatus,
  getOrderStats,
  updateCodPaymentStatus,
} = require("../controllers/orderController");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const router = express.Router();

// User routes
router.post("/", protect, placeOrder);
router.get("/my", protect, getMyOrders);
router.put("/:id/cancel", protect, cancelOrder);
router.put("/:id/address", protect, updateShippingAddress);

// Admin routes
router.get("/admin/all", protect, adminOnly, getAllOrders);
router.get("/admin/stats", protect, adminOnly, getOrderStats);
router.put("/admin/:id/status", protect, adminOnly, adminUpdateOrderStatus);
router.put("/admin/:id/payment-status", protect, adminOnly, updateCodPaymentStatus);

module.exports = router;
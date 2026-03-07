const express = require("express");
const {
  createReturn,
  getMyReturns,
  getAllReturns,
  updateReturnStatus,
} = require("../controllers/returnController");
const protect   = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

const router = express.Router();

// User routes
router.post("/",     protect, createReturn);
router.get("/my",    protect, getMyReturns);

// Admin routes
router.get("/admin/all",          protect, adminOnly, getAllReturns);
router.put("/admin/:id/status",   protect, adminOnly, updateReturnStatus);

module.exports = router;
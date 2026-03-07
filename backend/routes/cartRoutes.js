const express = require("express");
const {
  addToCart,
  getMyCart,
  updateCartQty,
  removeFromCart,
  clearCart, // ✅ naya
} = require("../controllers/cartController");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/", protect, addToCart);
router.get("/", protect, getMyCart);
router.put("/", protect, updateCartQty);
router.delete("/", protect, clearCart);         // ✅ naya — DELETE /cart (puri cart clear)
router.delete("/:productId", protect, removeFromCart);

module.exports = router;
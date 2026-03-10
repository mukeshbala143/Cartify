const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  registerSeller, addSellerProduct, getSellerProducts,
  updateSellerProduct, deleteSellerProduct, getPendingSellers,
  approveSeller, rejectSeller, getSellerStatus, getAllSellers, toggleShopStatus, adminToggleShop
} = require("../controllers/sellerController");

router.post("/register", protect, registerSeller);
router.get("/status", protect, getSellerStatus);
router.get("/products", protect, getSellerProducts);
router.post("/products", protect, addSellerProduct);
router.put("/products/:id", protect, updateSellerProduct);
router.delete("/products/:id", protect, deleteSellerProduct);
router.get("/pending", protect, getPendingSellers);
router.get("/all", protect, getAllSellers);
router.put("/approve/:id", protect, approveSeller);
router.put("/reject/:id", protect, rejectSeller);

router.put("/toggle-shop", protect, toggleShopStatus);
router.put("/admin-toggle/:id", protect, adminToggleShop);
module.exports = router;
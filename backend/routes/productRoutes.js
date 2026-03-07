const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getAllProducts, getProductById, createProduct,
  updateProduct, deleteProduct, getAllProductsAdmin
} = require("../controllers/productController");

router.get("/", getAllProducts);
router.get("/admin/all", protect, getAllProductsAdmin);
router.get("/:id", getProductById);
router.post("/", protect, createProduct);
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct); 
module.exports = router; // admin can delete any
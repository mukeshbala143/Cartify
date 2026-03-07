const Cart = require("../models/cart");
const Product = require("../models/Product");

// ===============================
// 🔹 Add To Cart
// ===============================
exports.addToCart = async (req, res) => {
  try {
    const { productId, qty } = req.body;
    const userId = req.user._id;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const quantity = qty && qty > 0 ? qty : 1;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = new Cart({ user: userId, items: [{ product: productId, qty: quantity }] });
    } else {
      const existingItem = cart.items.find(item => item.product.toString() === productId);
      if (existingItem) {
        existingItem.qty += quantity;
      } else {
        cart.items.push({ product: productId, qty: quantity });
      }
    }

    await cart.save();
    const populatedCart = await cart.populate("items.product");

    res.status(200).json({ success: true, message: "Product added to cart", cart: populatedCart });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ===============================
// 🔹 Get Cart
// ===============================
exports.getMyCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

    if (!cart) {
      return res.status(200).json({ success: true, items: [], totalItems: 0, totalAmount: 0 });
    }

    const totalItems = cart.items.reduce((acc, item) => acc + item.qty, 0);
    const totalAmount = cart.items.reduce((acc, item) => acc + (item.product?.price || 0) * item.qty, 0);

    res.status(200).json({ success: true, cart, totalItems, totalAmount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ===============================
// 🔹 Update Cart Quantity
// ===============================
exports.updateCartQty = async (req, res) => {
  try {
    const { productId, qty } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID required" });
    }

    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    const item = cart.items.find(item => item.product.toString() === productId);

    if (!item) {
      return res.status(404).json({ success: false, message: "Product not in cart" });
    }

    if (qty <= 0) {
      cart.items = cart.items.filter(item => item.product.toString() !== productId);
    } else {
      item.qty = qty;
    }

    await cart.save();
    const updatedCart = await cart.populate("items.product");

    const totalItems = updatedCart.items.reduce((acc, item) => acc + item.qty, 0);
    const totalAmount = updatedCart.items.reduce((acc, item) => acc + (item.product?.price || 0) * item.qty, 0);

    res.status(200).json({ success: true, message: "Cart updated", cart: updatedCart, totalItems, totalAmount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ===============================
// 🔹 Remove From Cart
// ===============================
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();

    const updatedCart = await cart.populate("items.product");
    const totalItems = updatedCart.items.reduce((acc, item) => acc + item.qty, 0);
    const totalAmount = updatedCart.items.reduce((acc, item) => acc + (item.product?.price || 0) * item.qty, 0);

    res.status(200).json({ success: true, message: "Product removed", cart: updatedCart, totalItems, totalAmount });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

// ===============================
// 🔹 Clear Cart (order ke baad)
// ===============================
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { user: req.user._id },
      { $set: { items: [] } },
      { new: true }
    );

    res.status(200).json({ success: true, message: "Cart cleared", cart });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};
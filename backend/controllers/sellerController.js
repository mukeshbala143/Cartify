const User = require("../models/User");
const Product = require("../models/Product");
const { sendEmail } = require("../utils/emailService");

// User requests to become seller
exports.registerSeller = async (req, res) => {
  try {
    const { shopName, shopDescription, phone, countryCode } = req.body;
    if (!shopName) return res.status(400).json({ message: "Shop name required" });
    if (!phone) return res.status(400).json({ message: "Phone required" });

    // Check if already a pending/approved seller
    const existing = await User.findById(req.user._id);
    if (existing.isSeller && existing.sellerInfo?.approved) {
      return res.status(400).json({ message: "Already an approved seller" });
    }

    const user = await User.findByIdAndUpdate(req.user._id, {
      isSeller: true,
      sellerInfo: {
        shopName,
        shopDescription,
        phone,
        countryCode: countryCode || '+91',
        approved: false,
      },
    }, { new: true }).select("-password");

    res.json({ success: true, message: "Seller registration submitted! Admin will review.", user });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Seller adds a product
exports.addSellerProduct = async (req, res) => {
  try {
    const seller = await User.findById(req.user._id);
    if (!seller.isSeller) return res.status(403).json({ message: "Not a seller" });
    if (!seller.sellerInfo.approved && !req.user.isAdmin) {
      return res.status(403).json({ message: "Your seller account is pending admin approval" });
    }

    const { images, image, ...rest } = req.body;
    const allImages = images?.length ? images : (image ? [image] : []);
    const product = await Product.create({
      ...rest,
      image: allImages[0] || "",
      images: allImages,
      user: req.user._id,
      seller: req.user._id,
    });
    res.status(201).json({ success: true, product });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Seller gets their own products
exports.getSellerProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Seller updates their product
exports.updateSellerProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    if (!product) return res.status(404).json({ message: "Product not found or not yours" });
    const { images, image, ...rest } = req.body;
    const allImages = images?.length ? images : (image ? [image] : []);
    const updated = await Product.findByIdAndUpdate(req.params.id, {
      ...rest,
      image: allImages[0] || "",
      images: allImages,
    }, { new: true });
    res.json({ success: true, product: updated });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Seller deletes their product
exports.deleteSellerProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, seller: req.user._id });
    if (!product) return res.status(404).json({ message: "Product not found or not yours" });
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Product deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Admin: get all pending sellers
exports.getPendingSellers = async (req, res) => {
  try {
    const sellers = await User.find({ isSeller: true, "sellerInfo.approved": false }).select("-password");
    res.json({ success: true, sellers });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Admin: get ALL approved sellers with their products
exports.getAllSellers = async (req, res) => {
  try {
    const sellers = await User.find({ isSeller: true, "sellerInfo.approved": true }).select("-password");
    const sellersWithProducts = await Promise.all(sellers.map(async (seller) => {
      const products = await Product.find({ seller: seller._id }).sort({ createdAt: -1 });
      return { ...seller.toObject(), products };
    }));
    res.json({ success: true, sellers: sellersWithProducts });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Admin: approve seller
exports.approveSeller = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id,
      { "sellerInfo.approved": true, "sellerInfo.active": true }, { new: true }).select("-password");
    try {
      await sendEmail(user.email, 'Seller Account Approved - Cartify',
        '<h2>Hi ' + user.name + ',</h2><p>Your shop <strong>' + user.sellerInfo?.shopName + '</strong> has been approved! Login to your Seller Dashboard to start selling.</p><p>Team Cartify</p>');
    } catch(e) { console.error('Approval email failed:', e); }
    res.json({ success: true, message: "Seller approved!", user });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.toggleShopStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.isSeller || !user.sellerInfo?.approved) {
      return res.status(403).json({ message: "Not an approved seller" });
    }
    // Frontend sends desired state explicitly
    const newStatus = req.body.active;
    const updated = await User.findByIdAndUpdate(req.user._id,
      { "sellerInfo.active": newStatus }, { new: true }).select("-password");
    res.json({ success: true, active: newStatus, message: newStatus ? "Shop is now Active" : "Shop is now Inactive", user: updated });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Admin: reject/remove seller
exports.rejectSeller = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id,
      { isSeller: false, sellerInfo: {} }, { new: true }).select("-password");
    res.json({ success: true, message: "Seller rejected", user });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Get seller profile info
exports.getSellerStatus = async (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const user = await User.findById(req.user._id).select("-password");
    res.json({ success: true, isSeller: user.isSeller, sellerInfo: user.sellerInfo });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
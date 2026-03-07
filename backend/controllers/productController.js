const Product = require("../models/Product");

exports.getAllProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice } = req.query;
    let query = {};
    if (search) query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
    if (category) query.category = { $regex: `^${category}$`, $options: "i" };
    if (minPrice || maxPrice) query.price = {};
    if (minPrice) query.price.$gte = Number(minPrice);
    if (maxPrice) query.price.$lte = Number(maxPrice);

    const products = await Product.find(query).populate("seller", "name sellerInfo").sort({ createdAt: -1 });
    res.json(products);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("seller", "name sellerInfo");
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createProduct = async (req, res) => {
  try {
    const { images, image, ...rest } = req.body;
    const allImages = images?.length ? images : (image ? [image] : []);
    const product = await Product.create({
      ...rest,
      image: allImages[0] || "",
      images: allImages,
      user: req.user._id,
    });
    res.status(201).json(product);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateProduct = async (req, res) => {
  try {
    const { images, image, ...rest } = req.body;
    const allImages = images?.length ? images : (image ? [image] : []);
    const product = await Product.findByIdAndUpdate(req.params.id, {
      ...rest,
      image: allImages[0] || "",
      images: allImages,
    }, { new: true });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Admin can delete ANY product
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Product deleted successfully" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Admin: get ALL products with seller info
exports.getAllProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find({}).populate("seller", "name email sellerInfo").sort({ createdAt: -1 });
    res.json({ success: true, products });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
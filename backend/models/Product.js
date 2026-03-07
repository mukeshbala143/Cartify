const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  image: { type: String }, // primary image (backward compat)
  images: [{ type: String }], // multiple images
  category: { type: String, default: "Other" },
  countInStock: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
}, { timestamps: true });

productSchema.index({ name: "text", description: "text", category: "text" });
module.exports = mongoose.model("Product", productSchema);
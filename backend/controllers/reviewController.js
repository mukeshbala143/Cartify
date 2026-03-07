const Review = require("../models/review");

exports.getReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate("user", "name")
      .sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const { productId } = req.params;

    // One review per user per product
    const existing = await Review.findOne({ user: req.user._id, product: productId });
    if (existing) {
      existing.rating = rating;
      existing.comment = comment;
      await existing.save();
      const pop = await existing.populate("user", "name");
      return res.status(200).json(pop);
    }

    const review = await Review.create({
      user: req.user._id,
      product: productId,
      rating,
      comment,
    });

    const populated = await review.populate("user", "name");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

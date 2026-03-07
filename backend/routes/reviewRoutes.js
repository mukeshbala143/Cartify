const express = require("express");
const { getReviews, addReview } = require("../controllers/reviewController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:productId", getReviews);
router.post("/:productId", protect, addReview);

module.exports = router;

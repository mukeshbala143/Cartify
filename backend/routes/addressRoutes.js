const express = require("express");
const { getAddresses, addAddress, deleteAddress, setDefault } = require("../controllers/addressController");
const protect = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", protect, getAddresses);
router.post("/", protect, addAddress);
router.delete("/:id", protect, deleteAddress);
router.put("/:id/default", protect, setDefault);

module.exports = router;
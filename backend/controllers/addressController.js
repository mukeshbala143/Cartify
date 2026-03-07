const Address = require("../models/Address");

exports.getAddresses = async (req, res) => {
  const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });
  res.json({ success: true, addresses });
};

exports.addAddress = async (req, res) => {
  try {
    console.log("=== ADD ADDRESS CALLED ===");
    console.log("BODY:", req.body);
    console.log("USER:", req.user);
    
    const { name, phone, line1, line2, city, state, pincode, isDefault } = req.body;
    if (isDefault) await Address.updateMany({ user: req.user._id }, { isDefault: false });
    const address = await Address.create({ user: req.user._id, name, phone, line1, line2, city, state, pincode, isDefault: isDefault || false });
    res.status(201).json({ success: true, address });
  } catch (err) { 
    console.log("=== ERROR ===", err.message);
    res.status(500).json({ message: err.message }); 
  }
};
exports.deleteAddress = async (req, res) => {
  await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true });
};

exports.setDefault = async (req, res) => {
  await Address.updateMany({ user: req.user._id }, { isDefault: false });
  await Address.findByIdAndUpdate(req.params.id, { isDefault: true });
  res.json({ success: true });
};
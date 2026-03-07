const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
dotenv.config();

const User = require("./models/User"); // adjust path if needed

async function resetAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    const newPassword = "Rcb12@@1";
    const hashed = await bcrypt.hash(newPassword, 10);

    // Remove old admin entry if it exists
    await User.deleteOne({ email: "admin@cartify.in" });

    const admin = await User.findOneAndUpdate(
      { email: "noreply.cartify@gmail.com" },
      {
        password: hashed,
        isAdmin: true,
        name: "Admin",
        email: "noreply.cartify@gmail.com",
      },
      { upsert: true, new: true }
    );

    console.log("✅ Admin user updated!");
    console.log("   Email   : noreply.cartify@gmail.com");
    console.log("   Password: Rcb12@@1");
    console.log("   isAdmin :", admin.isAdmin);
    console.log("   _id     :", admin._id);
  } catch (err) {
    console.error("❌ Failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

resetAdmin();
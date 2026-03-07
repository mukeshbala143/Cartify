const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const googleAuthRoutes = require('./routes/googleAuthRoutes');
const returnRoutes = require('./routes/returnRoutes');

dotenv.config();
connectDB();

const app = express();
app.use(cors({ origin: ["http://localhost:5173","http://localhost:5174","http://localhost:5175","http://localhost:3000"], credentials: true }));
app.use(express.json());

app.get("/", (req, res) => res.send("Cartify Backend 🚀"));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/addresses", require("./routes/addressRoutes"));
app.use("/api/seller", require("./routes/sellerRoutes"));
app.use('/api/auth', googleAuthRoutes);
app.use('/api/returns', returnRoutes);

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
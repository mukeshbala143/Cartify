const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Product = require("./models/Product");
const User = require("./models/User");
const bcrypt = require("bcryptjs");

const products = [
  {
    name: "Apple iPhone 15 Pro Max - 256GB Natural Titanium",
    description: "The most powerful iPhone ever with A17 Pro chip, titanium design, and a 48MP camera system. Features Action button and USB-C connectivity.",
    price: 159900,
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&q=80",
    countInStock: 15,
    category: "Electronics",
    rating: 4.9,
  },
  {
    name: "Samsung Galaxy S24 Ultra - 512GB Titanium Black",
    description: "Experience the next level of Galaxy AI with the S24 Ultra. Features a 200MP camera, built-in S Pen, and Snapdragon 8 Gen 3.",
    price: 134999,
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&q=80",
    countInStock: 10,
    category: "Electronics",
    rating: 4.8,
  },
  {
    name: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    description: "Industry-leading noise cancellation with 30-hour battery life. Crystal clear hands-free calling and Alexa built-in.",
    price: 29990,
    image: "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&q=80",
    countInStock: 25,
    category: "Electronics",
    rating: 4.7,
  },
  {
    name: "Apple MacBook Air M3 - 13 inch 16GB/512GB",
    description: "Supercharged by M3 chip. Up to 18 hours of battery life, fanless design, and a stunning Liquid Retina display.",
    price: 149900,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80",
    countInStock: 8,
    category: "Electronics",
    rating: 4.9,
  },
  {
    name: "Nike Air Jordan 1 Retro High OG - Chicago",
    description: "The iconic silhouette that started it all. Premium leather upper with Air-Sole unit for lightweight cushioning.",
    price: 12999,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    countInStock: 30,
    category: "Fashion",
    rating: 4.8,
  },
  {
    name: "Levi's 501 Original Fit Jeans - Stonewash Blue",
    description: "The original blue jean. Straight fit from hip to ankle. 100% cotton denim with button fly closure.",
    price: 3999,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&q=80",
    countInStock: 50,
    category: "Fashion",
    rating: 4.5,
  },
  {
    name: "Dyson V15 Detect Cordless Vacuum Cleaner",
    description: "Reveals invisible dust with the laser. 60 minutes of fade-free power. Automatically adapts suction to the floor type.",
    price: 52900,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    countInStock: 12,
    category: "Home & Garden",
    rating: 4.6,
  },
  {
    name: "IKEA MALM King Size Bed Frame with Storage",
    description: "Includes 4 large drawers for extra storage. Made of durable materials with a clean Scandinavian design.",
    price: 24999,
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80",
    countInStock: 5,
    category: "Home & Garden",
    rating: 4.4,
  },
  {
    name: "Adidas Ultraboost 23 Running Shoes",
    description: "Energized boost cushioning returns energy with every stride. Primeknit+ upper adapts to your foot.",
    price: 17999,
    image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=600&q=80",
    countInStock: 40,
    category: "Sports",
    rating: 4.7,
  },
  {
    name: "Yoga Mat Premium Non-Slip - 6mm Thickness",
    description: "Eco-friendly TPE material with alignment lines. Anti-slip texture on both sides. Includes carrying strap.",
    price: 1499,
    image: "https://images.unsplash.com/photo-1601925228008-d1da6bd46f50?w=600&q=80",
    countInStock: 60,
    category: "Sports",
    rating: 4.5,
  },
  {
    name: "Atomic Habits by James Clear - Hardcover",
    description: "Tiny Changes, Remarkable Results. An Easy & Proven Way to Build Good Habits & Break Bad Ones. #1 NYT Bestseller.",
    price: 599,
    image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80",
    countInStock: 100,
    category: "Books",
    rating: 4.9,
  },
  {
    name: "The Psychology of Money by Morgan Housel",
    description: "Timeless lessons on wealth, greed, and happiness. 19 short stories exploring the strange ways people think about money.",
    price: 499,
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80",
    countInStock: 80,
    category: "Books",
    rating: 4.8,
  },
  {
    name: "MAC Studio Fix Fluid Foundation SPF 15",
    description: "Medium-to-full buildable coverage with a natural matte finish. SPF 15 protection. Available in 64 shades.",
    price: 2499,
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&q=80",
    countInStock: 35,
    category: "Beauty",
    rating: 4.6,
  },
  {
    name: "The Ordinary Niacinamide 10% + Zinc 1% Serum",
    description: "High-strength vitamin and mineral formula. Reduces appearance of blemishes and congestion. 30ml bottle.",
    price: 899,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&q=80",
    countInStock: 45,
    category: "Beauty",
    rating: 4.7,
  },
  {
    name: "boAt Airdopes 141 Bluetooth Earbuds",
    description: "42H playtime with beast mode low latency. IPX4 water resistance. ASAP Charge gives 75 mins in 10 min charging.",
    price: 1299,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80",
    countInStock: 100,
    category: "Electronics",
    rating: 4.3,
  },
  {
    name: "Instant Pot Duo 7-in-1 Electric Pressure Cooker 6Qt",
    description: "7 appliances in one: pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker and warmer.",
    price: 8999,
    image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&q=80",
    countInStock: 20,
    category: "Home & Garden",
    rating: 4.7,
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Create or find admin user
    let admin = await User.findOne({ email: "admin@cartify.in" });
    if (!admin) {
      const hashed = await bcrypt.hash("admin123", 10);
      admin = await User.create({
        name: "Admin",
        email: "admin@cartify.in",
        password: hashed,
        isAdmin: true,
      });
      console.log("✅ Admin user created: admin@cartify.in / admin123");
    }

    // Create demo user
    let demo = await User.findOne({ email: "demo@cartify.in" });
    if (!demo) {
      const hashed = await bcrypt.hash("demo123", 10);
      demo = await User.create({
        name: "Demo User",
        email: "demo@cartify.in",
        password: hashed,
      });
      console.log("✅ Demo user created: demo@cartify.in / demo123");
    }

    // Clear existing products (optional)
    const count = await Product.countDocuments();
    if (count > 0) {
      console.log(`ℹ️  ${count} products already exist. Skipping seed.`);
      console.log("   To re-seed, delete products from MongoDB and run again.");
      await mongoose.disconnect();
      return;
    }

    // Insert products
    const productsWithUser = products.map(p => ({ ...p, user: admin._id }));
    await Product.insertMany(productsWithUser);
    console.log(`✅ ${products.length} products added successfully!`);
    console.log("\n🚀 Seed complete! Run: npm run dev");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
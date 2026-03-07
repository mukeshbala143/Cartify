# 🛒 Cartify - Full Stack E-Commerce

A modern, full-featured e-commerce platform built with React + Vite (frontend) and Node.js + Express + MongoDB (backend).

## 🚀 Features

### Frontend
- 🏠 **Homepage** - Hero section, categories, featured products, banners
- 🔍 **Smart Search** - Real-time search with suggestions and filters
- 📦 **Product Listing** - Grid/list view, category filters, price range, sort
- 🛒 **Cart** - Add/remove/update qty, coupon codes, Razorpay checkout
- ❤️ **Wishlist** - Save products locally
- 📋 **Orders** - Order history with tracking status
- ⭐ **Reviews** - Product ratings and reviews system
- 👤 **Auth** - Login/Register with JWT, password strength meter
- 🔧 **Admin Panel** - Add/edit/delete products with dashboard charts

### Backend (Updated)
- 🔐 Auth routes with JWT
- 📦 Product CRUD + search/filter
- 🛒 Cart (user-specific, protected)
- 📋 Orders with stock management
- 💳 Razorpay payment integration
- ⭐ Reviews system

## 📁 Project Structure

```
CARTIFY/
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── razorpay.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── cartController.js     ← Updated (user-specific)
│   │   ├── orderController.js
│   │   ├── paymentController.js
│   │   ├── productController.js  ← Updated (CRUD + search)
│   │   └── reviewController.js   ← NEW
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── cart.js
│   │   ├── order.js
│   │   ├── Product.js            ← Updated (category, rating)
│   │   ├── review.js             ← NEW
│   │   └── user.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── cartRoutes.js         ← Updated (protected)
│   │   ├── orderRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── productRoutes.js      ← Updated (CRUD)
│   │   └── reviewRoutes.js       ← NEW
│   ├── .env
│   ├── package.json
│   └── server.js                 ← Updated (all routes)
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Navbar.jsx
    │   │   │   └── Footer.jsx
    │   │   ├── product/
    │   │   │   └── ProductCard.jsx
    │   │   └── common/
    │   │       ├── Skeleton.jsx
    │   │       └── StarRating.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   ├── CartContext.jsx
    │   │   └── WishlistContext.jsx
    │   ├── pages/
    │   │   ├── HomePage.jsx
    │   │   ├── ProductsPage.jsx
    │   │   ├── ProductDetailPage.jsx
    │   │   ├── CartPage.jsx
    │   │   ├── OrdersPage.jsx
    │   │   ├── WishlistPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   └── AdminPage.jsx
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    └── vite.config.js
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB running locally or Atlas URI

### 1. Backend Setup

```bash
cd backend
npm install
```

Edit `.env` file:
```env
PORT=5050
MONGO_URI=mongodb://127.0.0.1:27017/CARTIFY
JWT_SECRET=cartifysecret
RAZORPAY_KEY_ID=rzp_test_SNQbUAVzbgJ4y6
RAZORPAY_SECRET=qVsAZ3b3Ro5uCWccgZAstOLG
```

```bash
npm run dev
# Server starts on http://localhost:5050
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# App starts on http://localhost:5173
```

## 🎯 Admin Panel Access

The admin panel is at `/admin`. Currently any logged-in user can access it.

To restrict to admins only:
1. Add `isAdmin: Boolean` field to User model
2. Set `isAdmin: true` in MongoDB for admin users
3. The navbar will show "Admin Panel" link automatically

## 🔑 Test Credentials

Register a new account at `/register` or use:
- Email: demo@cartify.in
- Password: demo123 (create this user first via /register)

## 💳 Payment Testing (Razorpay)

Use test card details:
- Card: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: Any 3 digits
- OTP: 1234

## 📱 Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage with hero, categories, featured products |
| `/products` | All products with search & filters |
| `/product/:id` | Product detail with reviews |
| `/cart` | Shopping cart with coupon codes |
| `/orders` | Order history with tracking |
| `/wishlist` | Saved products |
| `/login` | Login page |
| `/register` | Register page |
| `/admin` | Admin dashboard (protected) |

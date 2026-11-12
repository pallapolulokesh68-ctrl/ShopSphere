
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Models
const Product = require("./models/product");
const User = require("./models/user");
const Order = require("./models/order");

// Middleware
const authMiddleware = require("./middleware/authMiddleware");
const adminMiddleware = require("./middleware/adminMiddleware");

// Routes
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const cartRoutes = require("./routes/cartRoutes");
const wishlistRoutes = require("./routes/wishlistRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.send("ShopSphere API is running!");
});

// API routes
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin/orders", adminOrderRoutes);

// ========================================
// ADMIN DASHBOARD STATISTICS API
// ========================================

app.get(
    "/api/admin/stats",
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            const totalProducts = await Product.countDocuments();

            const totalOrders = await Order.countDocuments();

            const totalUsers = await User.countDocuments({
                role: "user"
            });

            res.status(200).json({
                totalProducts,
                totalOrders,
                totalUsers
            });

        } catch (error) {
            console.error("Admin statistics error:", error);

            res.status(500).json({
                message: "Unable to fetch dashboard statistics."
            });
        }
    }
);

// ========================================
// MONGODB CONNECTION
// ========================================

const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });

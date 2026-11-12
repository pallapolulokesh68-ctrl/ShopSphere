
const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();

const Wishlist = require("../models/wishlist");
const Product = require("../models/product");
const authMiddleware = require("../middleware/authMiddleware");

// GET user's wishlist
router.get("/", authMiddleware, async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({
            user: req.user.id
        }).populate("products");

        if (!wishlist) {
            return res.status(200).json({
                products: []
            });
        }

        res.status(200).json(wishlist);
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// ADD product to wishlist
router.post("/add", authMiddleware, async (req, res) => {
    try {
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({
                message: "Product ID is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                message: "Invalid product ID"
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        let wishlist = await Wishlist.findOne({
            user: req.user.id
        });

        if (!wishlist) {
            wishlist = new Wishlist({
                user: req.user.id,
                products: []
            });
        }

        if (wishlist.products.some(
            id => id.toString() === productId
        )) {
            return res.status(400).json({
                message: "Product already in wishlist"
            });
        }

        wishlist.products.push(productId);
        await wishlist.save();

        const updatedWishlist = await Wishlist.findById(wishlist._id)
            .populate("products");

        res.status(200).json({
            message: "Product added to wishlist",
            wishlist: updatedWishlist
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// REMOVE product from wishlist
router.delete("/remove/:productId", authMiddleware, async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({
            user: req.user.id
        });

        if (!wishlist) {
            return res.status(404).json({
                message: "Wishlist not found"
            });
        }

        const productExists = wishlist.products.some(
            id => id.toString() === req.params.productId
        );

        if (!productExists) {
            return res.status(404).json({
                message: "Product not found in wishlist"
            });
        }

        wishlist.products = wishlist.products.filter(
            id => id.toString() !== req.params.productId
        );

        await wishlist.save();

        res.status(200).json({
            message: "Product removed from wishlist"
        });
    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;

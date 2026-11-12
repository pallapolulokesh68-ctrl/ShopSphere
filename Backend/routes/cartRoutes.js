
const express = require("express");
const router = express.Router();

const Cart = require("../models/cart");
const Product = require("../models/product");
const authMiddleware = require("../middleware/authMiddleware");

// GET user's cart
router.get("/", authMiddleware, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id })
            .populate("items.product");

        if (!cart) {
            return res.status(200).json({ items: [] });
        }

        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ADD product to cart
router.post("/add", authMiddleware, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        if (!productId || !Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                message: "Valid product ID and quantity are required"
            });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        if (product.stock < quantity) {
            return res.status(400).json({
                message: "Insufficient stock"
            });
        }

        let cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            cart = new Cart({
                user: req.user.id,
                items: []
            });
        }

        const existingItem = cart.items.find(
            item => item.product.toString() === productId
        );

        if (existingItem) {
            if (existingItem.quantity + quantity > product.stock) {
                return res.status(400).json({
                    message: "Insufficient stock"
                });
            }

            existingItem.quantity += quantity;
        } else {
            cart.items.push({
                product: productId,
                quantity
            });
        }

        await cart.save();

        const updatedCart = await Cart.findById(cart._id)
            .populate("items.product");

        res.status(200).json({
            message: "Product added to cart",
            cart: updatedCart
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// UPDATE product quantity
router.put("/update/:productId", authMiddleware, async (req, res) => {
    try {
        const { quantity } = req.body;

        if (!Number.isInteger(quantity) || quantity < 1) {
            return res.status(400).json({
                message: "Quantity must be at least 1"
            });
        }

        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found"
            });
        }

        const item = cart.items.find(
            item => item.product.toString() === req.params.productId
        );

        if (!item) {
            return res.status(404).json({
                message: "Product not found in cart"
            });
        }

        const product = await Product.findById(req.params.productId);

        if (!product || quantity > product.stock) {
            return res.status(400).json({
                message: "Insufficient stock"
            });
        }

        item.quantity = quantity;
        await cart.save();

        const updatedCart = await Cart.findById(cart._id)
            .populate("items.product");

        res.status(200).json({
            message: "Cart quantity updated",
            cart: updatedCart
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// REMOVE product from cart
router.delete("/remove/:productId", authMiddleware, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });

        if (!cart) {
            return res.status(404).json({
                message: "Cart not found"
            });
        }

        cart.items = cart.items.filter(
            item => item.product.toString() !== req.params.productId
        );

        await cart.save();

        res.status(200).json({
            message: "Product removed from cart"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;


const express = require("express");
const router = express.Router();

const Order = require("../models/order");
const Cart = require("../models/cart");
const Product = require("../models/product");
const authMiddleware = require("../middleware/authMiddleware");

// PLACE ORDER
router.post("/place", authMiddleware, async (req, res) => {
    try {
        const {
            fullName,
            phone,
            address,
            city,
            pincode
        } = req.body;

        if (!fullName || !phone || !address || !city || !pincode) {
            return res.status(400).json({
                message: "Please provide complete delivery details"
            });
        }

        const cart = await Cart.findOne({
            user: req.user.id
        }).populate("items.product");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                message: "Your cart is empty"
            });
        }

        let totalAmount = 0;
        const orderItems = [];

        for (const item of cart.items) {
            const product = item.product;

            if (!product) {
                return res.status(400).json({
                    message: "A product in your cart no longer exists"
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for ${product.name}`
                });
            }

            orderItems.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity
            });

            totalAmount += product.price * item.quantity;
        }

        // Create order
        const order = new Order({
            user: req.user.id,
            items: orderItems,
            totalAmount,
            shippingAddress: {
                fullName,
                phone,
                address,
                city,
                pincode
            },
            paymentMethod: "COD",
            paymentStatus: "Pending",
            orderStatus: "Placed"
        });

        const savedOrder = await order.save();

        // Reduce product stock
        for (const item of cart.items) {
            await Product.findByIdAndUpdate(
                item.product._id,
                { $inc: { stock: -item.quantity } }
            );
        }

        // Clear cart after successful order
        cart.items = [];
        await cart.save();

        res.status(201).json({
            message: "Order placed successfully",
            order: savedOrder
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// GET MY ORDERS
router.get("/my-orders", authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user.id
        }).sort({ createdAt: -1 });

        res.status(200).json(orders);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// GET SINGLE ORDER
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user.id
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        res.status(200).json(order);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;

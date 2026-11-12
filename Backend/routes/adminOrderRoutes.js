
const express = require("express");
const router = express.Router();

const Order = require("../models/order");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// GET ALL ORDERS (ADMIN ONLY)
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate("user", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json(orders);

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// GET SINGLE ORDER (ADMIN ONLY)
router.get("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate("user", "name email");

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

// UPDATE ORDER STATUS (ADMIN ONLY)
router.put("/:id/status", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { orderStatus } = req.body;

        const allowedStatuses = [
            "Processing",
            "Shipped",
            "Delivered",
            "Cancelled"
        ];

        if (!allowedStatuses.includes(orderStatus)) {
            return res.status(400).json({
                message: "Invalid order status"
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        if (order.orderStatus === "Cancelled" ||
            order.orderStatus === "Delivered") {
            return res.status(400).json({
                message: "This order cannot be updated"
            });
        }

        order.orderStatus = orderStatus;

        await order.save();

        res.status(200).json({
            message: "Order status updated successfully",
            order
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;

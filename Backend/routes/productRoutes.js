
const express = require("express");
const router = express.Router();

const Product = require("../models/product");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// GET all products (Public)
router.get("/", async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// GET single product (Public)
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// CREATE product (Admin only)
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const product = new Product(req.body);
        const savedProduct = await product.save();

        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// UPDATE product (Admin only)
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// DELETE product (Admin only)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);

        if (!deletedProduct) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        res.status(200).json({
            message: "Product deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

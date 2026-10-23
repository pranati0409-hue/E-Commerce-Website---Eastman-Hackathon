
const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");

const router = express.Router();

// GET /api/products
// Supports search, category filtering and pagination.
router.get("/", async (req, res) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));

    const filter = { isActive: true };

    if (search && search.trim()) {
      const escaped = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { description: { $regex: escaped, $options: "i" } },
        { brand: { $regex: escaped, $options: "i" } },
      ];
    }

    if (category && category.trim()) {
      filter.category = category.trim();
    }

    const [products, total] = await Promise.all([
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: products.length,
      total,
      page: pageNumber,
      totalPages: Math.ceil(total / pageSize),
      products,
    });
  } catch (error) {
    console.error("Fetch products error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch products",
    });
  }
});

// GET /api/products/:id
// Retrieve a single product by MongoDB ID.
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findOne({
      _id: id,
      isActive: true,
    }).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({ success: true, product });
  } catch (error) {
    console.error("Fetch product error:", error.message);
    res.status(500).json({
      success: false,
      message: "Unable to fetch product",
    });
  }
});

module.exports = router;

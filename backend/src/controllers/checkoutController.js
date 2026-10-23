
const mongoose = require("mongoose");
const Order = require("../models/Order");
const { calculatePricing } = require("../services/pricingService");

const createCheckout = async (req, res) => {
  try {
    const { items, couponCode = "" } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty."
      });
    }

    // Validate the product IDs and item details.
    for (const item of items) {
      if (
        !item.productId ||
        !mongoose.isValidObjectId(item.productId) ||
        typeof item.name !== "string" ||
        !item.name.trim() ||
        typeof item.unitPrice !== "number" ||
        !Number.isFinite(item.unitPrice) ||
        item.unitPrice < 0 ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid checkout item details."
        });
      }
    }

    // Calculate subtotal, coupon discount, and final total.
    const pricing = await calculatePricing(items, couponCode);

    // Save the order in MongoDB.
    const order = await Order.create({
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name.trim(),
        unitPrice: item.unitPrice,
        quantity: item.quantity
      })),
      subtotal: pricing.subtotal,
      discount: pricing.discount,
      total: pricing.total,
      couponCode: pricing.couponCode
    });

    return res.status(201).json({
      success: true,
      message: "Checkout completed and order created successfully.",
      data: {
        orderId: order._id,
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount,
        total: order.total,
        couponCode: order.couponCode,
        status: order.status,
        createdAt: order.createdAt
      }
    });
  } catch (error) {
    const clientErrors = [
      "Your cart is empty.",
      "Invalid item price or quantity.",
      "Invalid or inactive coupon.",
      "This coupon has expired."
    ];

    const isClientError =
      clientErrors.includes(error.message) ||
      error.message.startsWith("Minimum order amount");

    console.error("Checkout error:", error.message);

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: isClientError
        ? error.message
        : "Unable to complete checkout right now."
    });
  }
};

module.exports = { createCheckout };

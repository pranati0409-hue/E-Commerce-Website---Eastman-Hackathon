
const mongoose = require("mongoose");
const Order = require("../models/Order");

const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.isValidObjectId(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID."
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found."
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order retrieved successfully.",
      data: order
    });
  } catch (error) {
    console.error("Get order error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve order right now."
    });
  }
};

module.exports = { getOrderById };

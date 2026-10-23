
const { calculatePricing } = require("../services/pricingService");

const validateCoupon = async (req, res) => {
  try {
    const { items, code } = req.body;

    if (typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a coupon code."
      });
    }

    const pricing = await calculatePricing(items, code);

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully!",
      data: pricing
    });
  } catch (error) {
    const clientErrors = [
      "Your cart is empty.",
      "Invalid item price or quantity.",
      "Invalid or inactive coupon."
    ];

    const isClientError =
      clientErrors.includes(error.message) ||
      error.message.startsWith("Minimum order amount") ||
      error.message === "This coupon has expired.";

    return res.status(isClientError ? 400 : 500).json({
      success: false,
      message: isClientError
        ? error.message
        : "Unable to validate coupon right now."
    });
  }
};

module.exports = { validateCoupon };


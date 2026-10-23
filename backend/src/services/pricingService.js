
const Coupon = require("../models/Coupon");

const calculatePricing = async (items, couponCode = "") => {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Your cart is empty.");
  }

  let subtotal = 0;

  for (const item of items) {
    const { unitPrice, quantity } = item;

    if (
      typeof unitPrice !== "number" ||
      !Number.isFinite(unitPrice) ||
      unitPrice < 0 ||
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      throw new Error("Invalid item price or quantity.");
    }

    subtotal += unitPrice * quantity;
  }

  subtotal = Number(subtotal.toFixed(2));

  let discount = 0;
  let appliedCoupon = null;

  if (couponCode.trim()) {
    const normalizedCode = couponCode.trim().toUpperCase();

    const coupon = await Coupon.findOne({
      code: normalizedCode,
      isActive: true
    });

    if (!coupon) {
      throw new Error("Invalid or inactive coupon.");
    }

    if (coupon.expiresAt && coupon.expiresAt <= new Date()) {
      throw new Error("This coupon has expired.");
    }

    if (subtotal < coupon.minOrderAmount) {
      throw new Error(
        `Minimum order amount is ₹${coupon.minOrderAmount}.`
      );
    }

    if (coupon.discountType === "percentage") {
      discount = subtotal * (coupon.discountValue / 100);

      if (coupon.maxDiscount !== null) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    // A discount cannot exceed the subtotal.
    discount = Math.min(subtotal, Math.max(0, discount));
    discount = Number(discount.toFixed(2));

    appliedCoupon = coupon.code;
  }

  const total = Number((subtotal - discount).toFixed(2));

  return {
    subtotal,
    discount,
    total,
    couponCode: appliedCoupon
  };
};

module.exports = { calculatePricing };

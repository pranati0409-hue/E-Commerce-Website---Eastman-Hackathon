
require("dotenv").config();

const mongoose = require("mongoose");
const Coupon = require("./src/models/Coupon");

async function seedCoupon() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");

    await Coupon.findOneAndUpdate(
      { code: "SAVE10" },
      {
        code: "SAVE10",
        discountType: "percentage",
        discountValue: 10,
        minOrderAmount: 500,
        maxDiscount: 100,
        isActive: true,
        expiresAt: null
      },
      { upsert: true, new: true, runValidators: true }
    );

    console.log("SAVE10 coupon created successfully!");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

seedCoupon();

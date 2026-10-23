
require("dotenv").config();
const mongoose = require("mongoose");
const Coupon = require("./models/Coupon");
const Order = require("./models/Order");

async function checkDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Database name:", mongoose.connection.name);

    const couponCount = await Coupon.countDocuments();
    const orderCount = await Order.countDocuments();

    console.log("Coupons stored:", couponCount);
    console.log("Orders stored:", orderCount);

    const coupon = await Coupon.findOne({ code: "SAVE10" });
    console.log("SAVE10 exists:", Boolean(coupon));

    const order = await Order.findById("6adaf4f48ee4c28fb0117902");
    console.log("Test order exists:", Boolean(order));
  } catch (error) {
    console.error("Diagnostic failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabase();

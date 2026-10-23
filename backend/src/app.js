
const express = require("express");
const cors = require("cors");
const checkoutRoutes = require("./routes/checkoutRoutes");
require("dotenv").config();

const connectDB = require("./config/db");
const couponRoutes = require("./routes/couponRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/coupons", couponRoutes);
app.use("/api/checkout", checkoutRoutes);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ShoppingCart-EMN backend is running!"
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

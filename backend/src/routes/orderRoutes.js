
const express = require("express");
const router = express.Router();

const { getOrderById } = require("../controllers/orderController");

router.get("/:orderId", getOrderById);

module.exports = router;

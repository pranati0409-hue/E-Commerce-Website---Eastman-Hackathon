
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true
        },
        name: {
          type: String,
          required: true,
          trim: true
        },
        unitPrice: {
          type: Number,
          required: true,
          min: 0
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        }
      }
    ],
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    couponCode: {
      type: String,
      default: null
    },
    status: {
      type: String,
      enum: ["placed", "cancelled"],
      default: "placed"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);

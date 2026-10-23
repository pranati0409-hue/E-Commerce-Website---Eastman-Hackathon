const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      unique: true,
    },
    passwordHash: { type: String, required: true, select: false },
  },
  {
    timestamps: true,
    collection: "users",
    autoIndex: false,
  }
);

module.exports =
  mongoose.models.User || mongoose.model("User", userSchema, "users");

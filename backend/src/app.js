
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const { createAuthRouter } = require("./routes/auth");
const productRoutes = require("./routes/productRoutes");
const couponRoutes = require("./routes/couponRoutes");
const checkoutRoutes = require("./routes/checkoutRoutes");
const orderRoutes = require("./routes/orderRoutes");

function createApp({
  User,
  sessionStore,
  frontendUrl,
  sessionSecret,
  nodeEnv = "development",
  sameSite = "lax",
  passwordHasher,
}) {
  const app = express();
  const isProduction = nodeEnv === "production";

  if (isProduction) app.set("trust proxy", 1);

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, false);
      return callback(null, origin === frontendUrl ? frontendUrl : false);
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-CSRF-Token"],
  }));
  app.use(express.json({ limit: "10kb", strict: true }));
  app.use(session({
    name: isProduction ? "__Host-oddly.sid" : "oddly.sid",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: sessionStore || MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "authSessions",
      ttl: 60 * 60 * 24 * 7,
    }),
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite,
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }));

  app.get("/api/health", (_req, res) => {
    res.json({ success: true, message: "Oddly Commerce API is running." });
  });
  app.get("/", (_req, res) => {
    res.json({ success: true, message: "Oddly Commerce API is running." });
  });
  app.use("/api/products", productRoutes);
  app.use("/api/coupons", couponRoutes);
  app.use("/api/checkout", checkoutRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/auth", createAuthRouter({ User, frontendUrl, passwordHasher }));

  app.use((error, _req, res, _next) => {
    if (error?.type === "entity.too.large") {
      return res.status(413).json({ message: "Request body is too large." });
    }
    if (error instanceof SyntaxError && "body" in error) {
      return res.status(400).json({ message: "Request body must be valid JSON." });
    }
    console.error("Request failed:", error?.name || "Error");
    return res.status(500).json({ message: "Unable to complete the request. Please try again." });
  });

  return app;
}

module.exports = { createApp };

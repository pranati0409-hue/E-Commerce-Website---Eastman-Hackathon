const crypto = require("node:crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const { rateLimit } = require("express-rate-limit");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function validateEmail(email) {
  return typeof email === "string" &&
    email.length <= 254 &&
    EMAIL_PATTERN.test(email.trim());
}

function validateSignup(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Enter valid signup details.";
  }
  if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 100) {
    return "Name must be between 1 and 100 characters.";
  }
  if (!validateEmail(body.email)) return "Enter a valid email address.";
  if (
    typeof body.password !== "string" ||
    body.password.length < 12 ||
    body.password.length > 72 ||
    Buffer.byteLength(body.password, "utf8") > 72
  ) {
    return "Password must be 12–72 characters and no more than 72 UTF-8 bytes.";
  }
  return null;
}

function validateLogin(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Enter valid login details.";
  }
  if (!validateEmail(body.email)) return "Enter a valid email address.";
  if (
    typeof body.password !== "string" ||
    !body.password ||
    body.password.length > 72 ||
    Buffer.byteLength(body.password, "utf8") > 72
  ) {
    return "Enter a valid password.";
  }
  return null;
}

function sessionOperation(session, operation) {
  return new Promise((resolve, reject) => {
    session[operation]((error) => error ? reject(error) : resolve());
  });
}

function createAuthRouter({ User, frontendUrl, passwordHasher = bcrypt }) {
  const router = express.Router();
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts. Please wait and try again." },
  });

  function verifyCsrf(req, res, next) {
    const origin = req.get("origin");
    const supplied = req.get("x-csrf-token");
    const expected = req.session?.csrfToken;
    if (
      origin !== frontendUrl ||
      typeof supplied !== "string" ||
      typeof expected !== "string"
    ) {
      return res.status(403).json({ message: "Your session expired. Refresh and try again." });
    }

    const suppliedBuffer = Buffer.from(supplied);
    const expectedBuffer = Buffer.from(expected);
    if (
      suppliedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)
    ) {
      return res.status(403).json({ message: "Your session expired. Refresh and try again." });
    }
    return next();
  }

  router.get("/csrf", (req, res, next) => {
    if (req.get("origin") !== frontendUrl) {
      return res.status(403).json({ message: "Request origin is not allowed." });
    }
    if (!req.session.csrfToken) {
      req.session.csrfToken = crypto.randomBytes(32).toString("base64url");
    }
    return req.session.save((error) => {
      if (error) return next(error);
      return res.json({ csrfToken: req.session.csrfToken });
    });
  });

  router.post("/signup", authLimiter, verifyCsrf, async (req, res, next) => {
    const invalidMessage = validateSignup(req.body);
    if (invalidMessage) return res.status(400).json({ message: invalidMessage });

    const email = req.body.email.trim().toLowerCase();
    try {
      const existingUser = await User.findOne({ email }).select("_id");
      if (existingUser) {
        return res.status(409).json({ message: "An account with that email already exists." });
      }

      const passwordHash = await passwordHasher.hash(req.body.password, 12);
      const user = await User.create({
        name: req.body.name.trim(),
        email,
        passwordHash,
      });

      await sessionOperation(req.session, "regenerate");
      req.session.userId = String(user._id);
      req.session.csrfToken = crypto.randomBytes(32).toString("base64url");
      await sessionOperation(req.session, "save");
      return res.status(201).json({ user: safeUser(user) });
    } catch (error) {
      if (error?.code === 11000) {
        return res.status(409).json({ message: "An account with that email already exists." });
      }
      return next(error);
    }
  });

  router.post("/login", authLimiter, verifyCsrf, async (req, res, next) => {
    const invalidMessage = validateLogin(req.body);
    if (invalidMessage) return res.status(400).json({ message: invalidMessage });

    try {
      const email = req.body.email.trim().toLowerCase();
      const user = await User.findOne({ email }).select("+passwordHash");
      const passwordMatches = user
        ? await passwordHasher.compare(req.body.password, user.passwordHash)
        : false;

      if (!passwordMatches) {
        return res.status(401).json({ message: "Invalid email or password." });
      }

      await sessionOperation(req.session, "regenerate");
      req.session.userId = String(user._id);
      req.session.csrfToken = crypto.randomBytes(32).toString("base64url");
      await sessionOperation(req.session, "save");
      return res.json({ user: safeUser(user) });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/me", async (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Sign in to view your account." });
    }
    try {
      const user = await User.findById(req.session.userId);
      if (!user) {
        await sessionOperation(req.session, "destroy");
        return res.status(401).json({ message: "Sign in to view your account." });
      }
      return res.json({ user: safeUser(user) });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/logout", verifyCsrf, async (req, res, next) => {
    try {
      await sessionOperation(req.session, "destroy");
      res.clearCookie(
        process.env.NODE_ENV === "production" ? "__Host-oddly.sid" : "oddly.sid",
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.COOKIE_SAME_SITE || "lax",
          path: "/",
        }
      );
      return res.json({ success: true });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = { createAuthRouter, safeUser, validateLogin, validateSignup };

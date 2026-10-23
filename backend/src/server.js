require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");
const { createApp } = require("./app");

function configurationError(message) {
  const error = new Error(message);
  error.code = "AUTH_CONFIGURATION";
  return error;
}

function reportStartupError(error) {
  if (error?.code === "AUTH_CONFIGURATION") {
    console.error("Startup configuration:", error.message);
  } else {
    console.error("Startup failed: MongoDB connection or collection verification failed; details omitted.");
  }
}

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (
    !value ||
    value.includes("YOUR_") ||
    value.includes("ROTATED_PASSWORD") ||
    value.includes("REPLACE_WITH")
  ) {
    throw configurationError(`${name} must be configured in backend/.env.`);
  }
  return value;
}

function databaseNameFromUri(uri) {
  let parsed;
  try {
    parsed = new URL(uri);
  } catch {
    throw configurationError("MONGODB_URI must be a valid MongoDB connection string.");
  }
  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  if (
    !["mongodb:", "mongodb+srv:"].includes(parsed.protocol) ||
    !databaseName ||
    databaseName.includes("YOUR_")
  ) {
    throw configurationError("MONGODB_URI must include the exact existing database name.");
  }
  return databaseName;
}

async function collectionExists(db, name) {
  return db.listCollections({ name }, { nameOnly: true }).hasNext();
}

async function verifyUsersCollection(db) {
  if (!(await collectionExists(db, "users"))) return false;

  const users = db.collection("users");
  const indexes = await users.indexes();
  const uniqueEmailIndex = indexes.some((index) =>
    index.unique === true &&
    Object.keys(index.key || {}).length === 1 &&
    index.key.email === 1
  );
  const sample = await users.findOne(
    {},
    { projection: { name: 1, email: 1, passwordHash: 1 } }
  );
  if (
    sample &&
    (typeof sample.name !== "string" ||
      typeof sample.email !== "string" ||
      typeof sample.passwordHash !== "string")
  ) {
    throw configurationError(
      "The existing users collection has an incompatible schema. No collection or index changes were made."
    );
  }
  if (!uniqueEmailIndex) {
    throw configurationError(
      "The existing users collection has no unique email index. No schema changes were made."
    );
  }
  return true;
}

async function verifySessionCollection(db) {
  if (!(await collectionExists(db, "authSessions"))) return false;

  const sessions = db.collection("authSessions");
  const indexes = await sessions.indexes();
  const ttlIndex = indexes.some(
    (index) => index.key?.expires === 1 && Number.isFinite(index.expireAfterSeconds)
  );
  const sample = await sessions.findOne(
    {},
    { projection: { expires: 1, session: 1 } }
  );
  if (
    !ttlIndex ||
    (sample && (!(sample.expires instanceof Date) || typeof sample.session !== "string"))
  ) {
    throw configurationError(
      "The existing authSessions collection is incompatible with the MongoDB session store. No changes were made."
    );
  }
  return true;
}

async function startServer() {
  const mongodbUri = requiredEnvironment("MONGODB_URI");
  const expectedDatabase = databaseNameFromUri(mongodbUri);
  const frontendUrl = requiredEnvironment("FRONTEND_URL").replace(/\/+$/, "");
  let frontendOrigin;
  try {
    frontendOrigin = new URL(frontendUrl);
  } catch {
    throw configurationError("FRONTEND_URL must be a valid frontend origin.");
  }
  if (
    frontendOrigin.origin !== frontendUrl ||
    frontendOrigin.username ||
    frontendOrigin.password ||
    (process.env.NODE_ENV === "production" && frontendOrigin.protocol !== "https:")
  ) {
    throw configurationError(
      "FRONTEND_URL must be a bare origin (and HTTPS in production)."
    );
  }

  const sessionSecret = requiredEnvironment("SESSION_SECRET");
  if (sessionSecret.length < 32) {
    throw configurationError("SESSION_SECRET must be at least 32 characters.");
  }
  if (process.env.AUTH_DATABASE_CONFIRMED !== "true") {
    throw configurationError(
      "Inspect the existing Atlas database and users collection, then set AUTH_DATABASE_CONFIRMED=true to approve auth collection creation if required."
    );
  }

  const sameSite = process.env.COOKIE_SAME_SITE || "lax";
  if (!["lax", "strict", "none"].includes(sameSite)) {
    throw configurationError("COOKIE_SAME_SITE must be lax, strict, or none.");
  }
  if (sameSite === "none" && (
    process.env.NODE_ENV !== "production" ||
    process.env.HTTPS_ENABLED !== "true"
  )) {
    throw configurationError("SameSite=None requires HTTPS and HTTPS_ENABLED=true in production.");
  }

  const port = Number(process.env.PORT || 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw configurationError("PORT must be a valid TCP port.");
  }

  mongoose.set("autoIndex", false);
  try {
    await mongoose.connect(mongodbUri);
    const db = mongoose.connection.db;
    if (db.databaseName !== expectedDatabase) {
      throw configurationError(
        "MongoDB connected to a database other than the explicit database in MONGODB_URI."
      );
    }

    const hasUsers = await verifyUsersCollection(db);
    await verifySessionCollection(db);
    if (!hasUsers) {
      await User.createCollection();
      await User.createIndexes();
      console.info("Created the approved users collection with a unique email index.");
    }

    const app = createApp({
      User,
      frontendUrl,
      sessionSecret,
      nodeEnv: process.env.NODE_ENV || "development",
      sameSite,
    });
    app.listen(port, () => {
      console.info(`Oddly Commerce API listening on port ${port}.`);
    });
  } catch (error) {
    await mongoose.disconnect().catch(() => {});
    reportStartupError(error);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  startServer().catch((error) => {
    reportStartupError(error);
    process.exitCode = 1;
  });
}

module.exports = {
  collectionExists,
  databaseNameFromUri,
  startServer,
  verifySessionCollection,
  verifyUsersCollection,
};

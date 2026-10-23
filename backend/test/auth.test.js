const { afterEach, test } = require("node:test");
const assert = require("node:assert/strict");
const expressSession = require("express-session");
const request = require("supertest");
const { createApp } = require("../src/app");
const {
  databaseNameFromUri,
  verifyUsersCollection,
} = require("../src/server");

const frontendUrl = "http://localhost:5174";
const users = [];
let nextId = 1;

function createUserModel() {
  return {
    findOne({ email }) {
      return {
        select() {
          return Promise.resolve(users.find((user) => user.email === email) || null);
        },
      };
    },
    async findById(id) {
      return users.find((user) => user._id === id) || null;
    },
    async create(values) {
      if (users.some((user) => user.email === values.email)) {
        const error = new Error("duplicate key");
        error.code = 11000;
        throw error;
      }
      const user = {
        _id: String(nextId++),
        ...values,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      };
      users.push(user);
      return user;
    },
  };
}

function createFixture() {
  const app = createApp({
    User: createUserModel(),
    sessionStore: new expressSession.MemoryStore(),
    frontendUrl,
    sessionSecret: "test-session-secret-at-least-32-characters",
    nodeEnv: "test",
    passwordHasher: {
      hash: async (password) => `hash:${password}`,
      compare: async (password, hash) => hash === `hash:${password}`,
    },
  });
  return { app, agent: request.agent(app) };
}

async function getCsrfToken(agent) {
  const response = await agent
    .get("/api/auth/csrf")
    .set("Origin", frontendUrl);
  assert.equal(response.status, 200);
  return response.body.csrfToken;
}

function postWithCsrf(agent, path, token, body) {
  const req = agent
    .post(path)
    .set("Origin", frontendUrl)
    .set("X-CSRF-Token", token);
  return body === undefined ? req.send() : req.send(body);
}

async function insertUser() {
  const user = {
    _id: String(nextId++),
    name: "Example Buyer",
    email: "buyer@example.com",
    passwordHash: "hash:SecurePassword123",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };
  users.push(user);
  return user;
}

afterEach(() => {
  users.length = 0;
  nextId = 1;
});

test("signup normalizes email, hashes password and returns a safe profile", async () => {
  const { agent } = createFixture();
  const csrfResponse = await agent
    .get("/api/auth/csrf")
    .set("Origin", frontendUrl);
  assert.equal(csrfResponse.status, 200);
  const token = csrfResponse.body.csrfToken;
  const priorCookie = csrfResponse.headers["set-cookie"][0].split(";")[0];
  const response = await postWithCsrf(agent, "/api/auth/signup", token, {
    name: "  Example Buyer ",
    email: " BUYER@Example.com ",
    password: "SecurePassword123",
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.user.name, "Example Buyer");
  assert.equal(response.body.user.email, "buyer@example.com");
  assert.equal("passwordHash" in response.body.user, false);
  assert.equal(users[0].passwordHash, "hash:SecurePassword123");
  assert.notEqual(response.headers["set-cookie"][0].split(";")[0], priorCookie);
  assert.match(response.headers["set-cookie"][0], /HttpOnly/i);
  assert.match(response.headers["set-cookie"][0], /SameSite=Lax/i);
  assert.equal((await agent.get("/api/auth/me").set("Origin", frontendUrl)).status, 200);
});

test("signup rejects duplicate normalized email", async () => {
  const { agent } = createFixture();
  let token = await getCsrfToken(agent);
  const details = {
    name: "Buyer",
    email: "buyer@example.com",
    password: "SecurePassword123",
  };
  assert.equal((await postWithCsrf(agent, "/api/auth/signup", token, details)).status, 201);

  token = await getCsrfToken(agent);
  const duplicate = await postWithCsrf(agent, "/api/auth/signup", token, {
    ...details,
    email: " BUYER@example.com ",
  });
  assert.equal(duplicate.status, 409);
});

test("signup rejects invalid body, name, email and password", async () => {
  const { agent } = createFixture();
  const token = await getCsrfToken(agent);
  for (const body of [
    null,
    { name: " ", email: "bad", password: "short" },
    { name: "Buyer", email: "buyer@example.com", password: "short" },
    { name: "Buyer", email: "buyer@example.com", password: "p".repeat(73) },
  ]) {
    const response = await postWithCsrf(agent, "/api/auth/signup", token, body);
    assert.equal(response.status, 400);
  }
});

test("login verifies password and normalizes email", async () => {
  const { agent } = createFixture();
  await insertUser();
  const token = await getCsrfToken(agent);
  const response = await postWithCsrf(agent, "/api/auth/login", token, {
    email: " BUYER@EXAMPLE.COM ",
    password: "SecurePassword123",
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.user.email, "buyer@example.com");
  assert.equal("passwordHash" in response.body.user, false);
  assert.equal((await agent.get("/api/auth/me").set("Origin", frontendUrl)).status, 200);
});

test("login uses a generic error for wrong password and unknown email", async () => {
  const { agent } = createFixture();
  await insertUser();
  let token = await getCsrfToken(agent);
  const wrongPassword = await postWithCsrf(agent, "/api/auth/login", token, {
    email: "buyer@example.com",
    password: "IncorrectPassword123",
  });
  token = await getCsrfToken(agent);
  const unknownUser = await postWithCsrf(agent, "/api/auth/login", token, {
    email: "unknown@example.com",
    password: "IncorrectPassword123",
  });

  assert.equal(wrongPassword.status, 401);
  assert.equal(unknownUser.status, 401);
  assert.equal(wrongPassword.body.message, unknownUser.body.message);
});

test("current user requires an authenticated server session", async () => {
  const { agent } = createFixture();
  const response = await agent.get("/api/auth/me").set("Origin", frontendUrl);
  assert.equal(response.status, 401);
});

test("logout invalidates the session and clears the cookie", async () => {
  const { agent } = createFixture();
  await insertUser();
  let token = await getCsrfToken(agent);
  assert.equal((await postWithCsrf(agent, "/api/auth/login", token, {
    email: "buyer@example.com",
    password: "SecurePassword123",
  })).status, 200);

  token = await getCsrfToken(agent);
  const response = await postWithCsrf(agent, "/api/auth/logout", token);
  assert.equal(response.status, 200);
  assert.match(response.headers["set-cookie"][0], /Expires=Thu, 01 Jan 1970/i);
  assert.equal((await agent.get("/api/auth/me").set("Origin", frontendUrl)).status, 401);
});

test("auth state-changing requests reject missing CSRF tokens and disallowed origins", async () => {
  const { agent } = createFixture();
  const noToken = await agent
    .post("/api/auth/signup")
    .set("Origin", frontendUrl)
    .send({ name: "Buyer", email: "buyer@example.com", password: "SecurePassword123" });
  const wrongOrigin = await agent
    .get("/api/auth/csrf")
    .set("Origin", "https://untrusted.example");
  assert.equal(noToken.status, 403);
  assert.equal(wrongOrigin.status, 403);
});

test("CORS allows only the configured frontend and credentials", async () => {
  const { app } = createFixture();
  const allowed = await request(app)
    .get("/api/health")
    .set("Origin", frontendUrl);
  const denied = await request(app)
    .get("/api/health")
    .set("Origin", "https://untrusted.example");

  assert.equal(allowed.headers["access-control-allow-origin"], frontendUrl);
  assert.equal(allowed.headers["access-control-allow-credentials"], "true");
  assert.equal(denied.headers["access-control-allow-origin"], undefined);
});

test("MongoDB URI requires an explicit database name", () => {
  assert.equal(
    databaseNameFromUri("mongodb+srv://user:password@example.mongodb.net/oddly"),
    "oddly"
  );
  assert.throws(
    () => databaseNameFromUri("mongodb+srv://user:password@example.mongodb.net/"),
    /exact existing database name/
  );
});

test("incompatible existing users collection is rejected without index changes", async () => {
  const usersCollection = {
    indexes: async () => [{ key: { _id: 1 }, unique: true }],
    findOne: async () => null,
  };
  const db = {
    listCollections: () => ({ hasNext: async () => true }),
    collection: () => usersCollection,
  };
  await assert.rejects(
    verifyUsersCollection(db),
    /no unique email index/
  );
});

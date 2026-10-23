# Oddly Commerce authentication API

## Local setup

1. Rotate any Atlas password that has been shared in chat, terminal output, or source code. Never paste database credentials into chat or commit them.
2. Copy `backend/.env.example` to `backend/.env`.
3. Replace `MONGODB_URI` with the rotated Atlas URI, including the confirmed existing database name. The example intentionally uses placeholders.
4. Inspect the selected database's `users` and `authSessions` collections before enabling authentication. The users collection must have `name`, normalized `email`, `passwordHash`, and a unique index on `email`. The service will stop without modifying an existing collection that is incompatible.
5. Set `AUTH_DATABASE_CONFIRMED=true` only after confirming the database and collection structure. If `users` does not exist, this explicitly authorizes creating only `users` and its unique email index; MongoStore creates the `authSessions` collection if absent. Existing session collections must have the MongoStore-compatible structure and TTL index.
6. Generate a session secret without sharing it:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
   ```

   Put the output in `SESSION_SECRET` in `backend/.env`.
7. Start the API:

   ```powershell
   cd backend
   npm install
   npm run dev
   ```

The frontend runs at `http://localhost:5174`; the API defaults to port `5000`. `FRONTEND_URL` must match the frontend origin exactly.

The storefront's current login and signup pages use a temporary in-memory demo profile and do not call this API or connect to MongoDB. Demo profiles are cleared when the page is refreshed. The API setup below is for running the backend service independently.

## Deployment

Use HTTPS and a long random session secret. Set `NODE_ENV=production`, the exact HTTPS frontend origin, and the appropriate cookie policy. Default `SameSite=Lax` works for same-site frontend/API deployments. Cross-site deployments need `COOKIE_SAME_SITE=none`, HTTPS, and `HTTPS_ENABLED=true`; browser third-party-cookie restrictions may still apply. Configure Atlas network access for the backend host. Never put `MONGODB_URI` or `SESSION_SECRET` in Vite variables or client code.

## Tests

`npm test` uses mocked users and an in-memory test session store; it does not connect to Atlas or change its data.

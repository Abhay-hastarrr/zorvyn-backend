# Backend Assignment

A Node.js/Express + MongoDB backend for managing users, role requests, and financial transactions with authentication, authorization, validation, caching, and rate limiting.


> ## Important for Evaluators
> Please read **[ASSUMPTIONS.md](./assumptions.md) first** before
> exploring the codebase or testing the APIs.
>
> It contains:
> - Why `.env` is intentionally pushed to this repository
> - All design decisions and their reasoning
> - Known limitations and production recommendations
> - Tradeoffs made during development
>
> Understanding these assumptions will give full context
> to every decision made in this project.

## Tech Stack
- Node.js, Express
- MongoDB, Mongoose
- JSON Web Tokens (JWT)
- express-validator
- express-rate-limit
- bcryptjs
- cookie-parser
- morgan

## Project Structure

```
backend-assingment/
  package.json
  server.js
  .env.example
  src/
    app.js
    config/
      db.js
      seed.js
    contorllers/
      auth.controller.js
      user.controller.js
      transaction.controller.js
      dashboard.controller.js
      roleRequest.controller.js
    middlewares/
      auth.middleware.js
      rateLimit.middleware.js
    models/
      user.model.js
      transcation.model.js
      RoleRequest.model.js
    routes/
      auth.routes.js
      user.routes.js
      transaction.routes.js
      dashboard.routes.js
      roleRequest.routes.js
    services/
      user.service.js
      transaction.service.js
      dashboard.service.js
      roleRequest.service.js
    utils/
      apiResponse.utils.js
      errorHandler.utils.js
      cache.utils.js
```

## Getting Started

### 1. Clone repo
```
git clone https://github.com/Abhay-hastarrr/zorvyn-backend.git
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the server

Development with nodemon:

```bash
npm run dev
```

Or plain Node:

```bash
npm start
```

Server starts at:

- `http://localhost:5000` 

## Middleware & Infrastructure

- **Logging:** `morgan` in dev mode
- **Cookies:** `cookie-parser` to read JWTs from `req.cookies.token`
- **Error handling:** centralized error handler in `errorHandler.utils.js`
- **Validation:** `express-validator` in route files
- **Caching:** in-memory cache (`cache.utils.js`) for dashboard endpoints
- **Rate limiting:** `express-rate-limit` via `rateLimit.middleware.js` on sensitive routes

## Authentication & Authorization

### Auth flow

- Register/login issue a JWT containing `{ id, role }`.
- JWT is stored in an HTTP-only cookie `token`.
- `auth.middleware.js`:
  - `verifyToken` - decodes JWT, attaches payload as `req.user`.
  - `userAuth` – any authenticated user.
  - `adminAuth` – only users with role `admin`.
  - `analystAuth` – users with role `admin` or `analyst`.

### Roles

- `viewer` (default)
- `analyst`
- `admin`

## Rate Limiting

Defined in `src/middlewares/rateLimit.middleware.js`:

- `authLimiter` (login/register)
  - 10 requests per 15 minutes per IP.
- `roleRequestLimiter` (create role change request)
  - 5 requests per hour per IP.
- `transactionWriteLimiter` (create/update/delete transactions)
  - 30 writes per minute per IP.
- `adminUserUpdateLimiter` (update user role/status)
  - 50 updates per hour per IP.

## Caching

Defined in `src/utils/cache.utils.js` (simple in-memory cache with TTL ~60s by default).

Used in `dashboard.service.js`:

- `getSummary()` – cache key `dashboard:summary`
- `getCategory()` – cache key `dashboard:categoryBreakdown`
- `getMonthlyTrends(year)` – cache key `dashboard:monthlyTrends:<year>`
- `getRecentTransactions(limit)` – cache key `dashboard:recent:<limit>`

Cache invalidation in `transaction.service.js` on create/update/delete via `clearCacheByPrefix('dashboard:')`.

## Validation Rules

### Auth (auth.routes.js)

- **Register** `POST /api/auth/register`
  - `name`: required
  - `email`: valid email
  - `password`: matches strong regex
    - At least 8 chars
    - Uppercase, lowercase, number, special character
- **Login** `POST /api/auth/login`
  - `email`: valid email
  - `password`: same strong regex

### Transactions (transaction.routes.js)

- `amount`: numeric, > 0
- `type`: `income` or `expense`
- `category`: required non-empty
- `date`:
  - valid ISO8601 date (`YYYY-MM-DD`)
  - must **not** be in the future

Update validations are the same but all fields are optional.

### Role Requests (roleRequest.routes.js)

- `requestedRole`: in [`admin`, `analyst`]
- `reason`: optional string

## API Overview

Base URL: `http://localhost:<PORT>/api`

### Auth Routes (auth.routes.js)

- `POST /api/auth/register`
  - Registers a new user, returns user data and sets JWT cookie.
- `POST /api/auth/login`
  - Logs in existing user, returns user data and sets JWT cookie.
- `POST /api/auth/logout`
  - Clears auth cookie.

### User Routes (user.routes.js)

All routes require `adminAuth`.

- `GET /api/users`
  - Returns list of users (without password, without `__v`).
- `PATCH /api/users/:id/role`
  - Body: `{ "role": "viewer" | "analyst" | "admin" }`.
  - Updates user role.
- `PATCH /api/users/:id/status`
  - Body: `{ "isActive": true | false }`.
  - Activates/deactivates user.

### Transaction Routes (transaction.routes.js)

- `POST /api/transactions` – `adminAuth`, `transactionWriteLimiter`
  - Creates a transaction linked to `req.user.id`.
- `GET /api/transactions` – `userAuth`
  - Supports filters via query:
    - `type` (`income`/`expense`)
    - `category` (partial, case-insensitive)
    - `from`, `to` (date range)
    - `page`, `limit` (pagination)
  - Returns `{ total, page, totalPages, limit, transactions }`.
- `GET /api/transactions/:id` – `userAuth`
  - Returns a single non-deleted transaction.
- `PATCH /api/transactions/:id` – `adminAuth`, `transactionWriteLimiter`
  - Updates allowed fields, with validation; cannot change `createdBy` or `isDeleted`.
- `DELETE /api/transactions/:id` – `adminAuth`, `transactionWriteLimiter`
  - Soft deletes a transaction (`isDeleted = true`).

### Dashboard Routes (dashboard.routes.js)

- `GET /api/dashboard/summary` – `analystAuth`
  - Returns income/expense totals and net balance.
- `GET /api/dashboard/category-breakdown` – `userAuth`
  - Returns aggregated amounts and counts per category and type.
- `GET /api/dashboard/monthly-trends?year=YYYY` – `userAuth`
  - Returns income/expense/net balance per month for the given year.
- `GET /api/dashboard/recent-transactions?limit=N` – `userAuth`
  - Returns latest N transactions (default 5).

### Role Request Routes (roleRequest.routes.js)

- `POST /api/role-requests` – `userAuth`, `roleRequestLimiter`
  - Creates a role-change request for the current user.
- `GET /api/role-requests` – `adminAuth`
  - Optional query: `status` (`pending`, `approved`, `rejected`).
  - Returns all matching requests with requester and reviewer populated.
- `GET /api/role-requests/my` – `userAuth`
  - Returns current user’s own role-change requests.
- `PATCH /api/role-requests/:id/approve` – `adminAuth`
  - Approves request, updates user role, records reviewer and time.
- `PATCH /api/role-requests/:id/reject` – `adminAuth`
  - Rejects request, records reviewer and time.

## Error Handling

All controllers use `try/catch` and pass errors to `next(err)`, which are handled by the global error handler in `src/utils/errorHandler.utils.js`:

- Sets `statusCode` from `err.status` or `err.statusCode` (or 500 fallback).
- Normalizes Mongoose validation, cast, duplicate key, and JWT errors.
- Returns consistent JSON:

```json
{
  "success": false,
  "message": "Error message here"
}
```

## Scripts

- `npm start` – run server with Node.
- `npm run dev` – run server with nodemon.


## Notes

- This is an in-memory cache and rate limiting setup; for production, consider Redis or another external store for better scalability and resilience.
- Passwords are stored hashed with bcrypt and never returned in responses.

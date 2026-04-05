# Assumptions & Design Decisions

This document outlines all assumptions, design decisions,
and tradeoffs made during development of the Finance
Dashboard Backend.

---

## Note for Evaluators

### Environment File
The `.env` file has been intentionally included in this
repository to make it easy for you to run and test the
project without any additional configuration.

I am fully aware that pushing `.env` files to public
repositories is a serious security risk in production
as it exposes credentials, secrets, and API keys.

In a real production project I would:
- Add `.env` to `.gitignore` immediately
- Use a secret manager such as AWS Secrets Manager
  or HashiCorp Vault
- Provide only a `.env.example` with placeholder values
- Share actual credentials through secure channels only

This was done purely for your convenience during evaluation.

---

## 1. User & Role Assumptions

### 1.1 Default Role on Registration

All users who register through the public registration
endpoint are assigned the `viewer` role by default.
Role elevation happens only through:
- Admin directly updating role via PATCH /api/users/:id/role
- User submitting a role request and admin approving it

**Reason:** Prevents self-assignment of privileged roles.
No user should be able to grant themselves elevated access.

---

### 1.2 First Admin Creation
The system requires at least one admin to function.
The first admin is created via a seed script (`npm run seed`) that:
- Reads credentials from environment variables only
- Validates password strength before creating
- Hashes password with bcrypt (12 salt rounds)
- Is idempotent — safe to run multiple times without
  creating duplicate admins

Subsequent admins are promoted by existing admins
through the user management API.

**Reason:** No public endpoint should ever create an
admin — that is a critical security vulnerability.
Seed scripts are the industry standard approach for
bootstrapping the first privileged user.

---

### 1.3 Role Hierarchy
viewer < analyst < admin
| Role | Access Level |
|------|-------------|
| viewer | Basic dashboard data only |
| analyst | Dashboard summary + financial insights |
| admin | Full access including write, delete, user management |

---

### 1.4 Role Changes Reflect After Re-login
Role changes made by admin do not reflect immediately
for the affected user. The user must log out and log
in again to receive a new token with the updated role.

**Reason:** Role is stored inside the JWT token to avoid
a database call on every request. This is a deliberate
performance tradeoff. The session-level impact is
acceptable for this use case.

---

### 1.5 Last Admin Protection
The system prevents the last active admin from being
demoted or deactivated. At least one active admin must
exist at all times.

**Reason:** If the last admin is locked out, there is
no way to recover admin access without direct database
intervention.

---

### 1.6 Self Modification Prevention
Admin cannot change their own role or deactivate their
own account through the API.

**Reason:** Prevents accidental self-lockout which would
require direct database intervention to recover.

---

### 1.7 Inactive User Blocking
If an admin deactivates a user, that user is blocked
on every subsequent request even if they hold a valid
unexpired JWT token.

**Reason:** Token expiry alone is not sufficient for
immediate access revocation. Active status is checked
on every authenticated request via database lookup.

---

## 2. Transaction Assumptions

### 2.1 Soft Delete Only
Transactions are never permanently deleted from the
database. Instead they are marked with `isDeleted: true`
and filtered out from all queries automatically.

**Reason:** Financial records should never be permanently
lost. Soft delete preserves audit history, enables data
recovery, and is standard practice in financial systems.

---

### 2.2 Only Admin Can Write Transactions
Only admin can create, update, and delete transactions.
Analyst and viewer roles are read-only for transactions.

**Reason:** The assignment defines:
- Analyst: can view records and access insights
- Admin: can create, update, and manage records

Analyst is treated as a read and analysis role,
not a data entry role.

---

### 2.3 Transaction Date Cannot Be in the Future
Transactions must have a past or present date.
Future dated transactions are rejected by validation.

**Reason:** This system tracks actual financial events
that have already occurred. It is not a budget planning
or forecasting tool. Future dates indicate data entry
errors.

---

### 2.4 Categories Are Free Text
Transaction categories are not restricted to a
predefined list. Any non-empty string up to 50
characters is accepted.

**Reason:** Predefined categories are too restrictive
for real world use. A food business may legitimately
record food as income. Restricting categories would
break valid use cases.

---

### 2.5 Amount Boundaries
- Minimum: greater than 0
- Maximum: 999,999,999

**Reason:** Zero amount transactions have no financial
meaning. The upper cap prevents accidental data entry
errors while covering all realistic transaction values.

---

### 2.6 Pagination Hard Cap
Maximum records per page is capped at 100 regardless
of what limit value is passed in the query.

**Reason:** Prevents performance degradation from
requests that attempt to fetch thousands of records
in a single query.

---

### 2.7 Orphaned createdBy Field
Every transaction stores a reference to the user who
created it. If that user is later deleted from the
system, `createdBy` will return `null` for their
transactions.

**Reason:** MongoDB document references become orphaned
when the referenced document is deleted. In production
this would be handled by preventing deletion of users
who have associated transactions, or by storing creator
name as a denormalized string alongside the reference.
This is a known limitation.

---

## 3. Authentication Assumptions

### 3.1 JWT in HttpOnly Cookie
Authentication tokens are stored in httpOnly cookies
rather than localStorage or response body.

**Reason:** HttpOnly cookies are inaccessible via
JavaScript which protects against XSS attacks.

---

### 3.2 JWT Configuration

| Property | Value |
|----------|-------|
| Algorithm | HS256 (default) |
| Payload | `{ id, role }` |
| Expiry | 1 hr |
| Storage | httpOnly cookie |

**Why role is in JWT:**
Storing role in the token avoids a database lookup
on every authenticated request. The tradeoff is that
role changes require re-login to take effect since
the old token still carries the old role.

---

### 3.3 Cookie Configuration

| Property | Value | Reason |
|----------|-------|--------|
| httpOnly | true | Not accessible via JavaScript |
| secure | false | Set true in production with HTTPS |
| sameSite | strict | Prevents CSRF attacks |
| maxAge | 1hr | Matches JWT expiry |

JWT and cookie share the same expiry of 1 hr.
After 1 hr the user must log in again to receive
a fresh token. This shorter session window reduces
the time a stolen token remains usable, improving
overall security.

---

### 3.4 Strong Password Policy
Passwords must meet all of the following:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character


**Reason:** Weak passwords are a primary attack vector.
Strong password policy is enforced at the application
level as a baseline security measure.

---

## 4. Caching Assumptions

### 4.1 In-Memory Cache with 60 Second TTL
Dashboard endpoints use an in-memory cache implemented
in `src/utils/cache.utils.js` with a TTL of 60 seconds.

| Cache Key | Endpoint | TTL |
|-----------|----------|-----|
| `dashboard:summary` | GET /dashboard/summary | 60s |
| `dashboard:categoryBreakdown` | GET /dashboard/category-breakdown | 60s |
| `dashboard:monthlyTrends:<year>` | GET /dashboard/monthly-trends | 60s |
| `dashboard:recent:<limit>` | GET /dashboard/recent-transactions | 60s |

**Reason:** Dashboard aggregation queries run across
the entire transactions collection. Caching reduces
database load for frequently accessed endpoints.

---

### 4.2 Cache Invalidation on Write
Cache is cleared automatically when any transaction
is created, updated, or deleted via
`clearCacheByPrefix('dashboard:')` in
`transaction.service.js`.

**Reason:** Ensures dashboard data is immediately
fresh after any data change. Data is never stale
after a write operation.

---

### 4.3 Cache Limitation
This is a simple in-memory cache. It:
- Resets on every server restart
- Does not work across multiple server instances
- Is not suitable for production at scale

**Production recommendation:** Replace with Redis
using ioredis or node-redis for persistent
distributed caching.

---

## 5. Rate Limiting Assumptions

### 5.1 Rate Limits Are Per IP
All rate limiters track requests by IP address
using `express-rate-limit`.

| Limiter | Route | Limit | Window |
|---------|-------|-------|--------|
| authLimiter | POST /auth/register, POST /auth/login | 10 requests | 15 minutes |
| roleRequestLimiter | POST /role-requests | 5 requests | 1 hour |
| transactionWriteLimiter | POST/PATCH/DELETE /transactions | 30 requests | 1 minute |
| adminUserUpdateLimiter | PATCH /users/:id/role, /users/:id/status | 50 requests | 1 hour |

**Reason:** Rate limiting prevents brute force attacks
on auth endpoints and abuse of write operations.

---

### 5.2 Rate Limit Response
When limit is exceeded the API returns:
```json
{
  "success": false,
  "message": "Too many requests, please try again later."
}
```
Status code: `429 Too Many Requests`

---

### 5.3 Rate Limiter Limitation
Rate limiting uses default in-memory store.
- Does not persist across server restarts
- Does not work correctly across multiple instances

**Production recommendation:** Use Redis store with
express-rate-limit for distributed rate limiting.

---

## 6. Dashboard & Insights Assumptions

### 6.1 Dashboard Access Split

| Endpoint | Access | Reason |
|----------|--------|--------|
| `/dashboard/recent-transactions` | All roles | Basic activity visibility |
| `/dashboard/category-breakdown` | All roles | Basic spending overview |
| `/dashboard/monthly-trends` | All roles | Basic pattern visibility |
| `/dashboard/summary` | Analyst + Admin | Core financial analysis |

**Reason:** Viewers need basic visibility into financial
activity. Deeper financial summaries are analyst
responsibilities per the assignment definition.

---

### 6.2 Dashboard Excludes Deleted Transactions
All aggregation pipelines filter out soft deleted
transactions via `isDeleted: false`.

**Reason:** Deleted transactions should not affect
financial summaries or analytics.

---

### 6.3 Monthly Trends Default Year
If no year query parameter is provided, trends default
to the current calendar year.

---

## 7. Role Request Assumptions

### 7.1 Only Upgrades Allowed
Users can only request a higher role than their
current role. Downgrade requests are rejected.

**Reason:** Role downgrade is an admin action not a
user action. Users requesting lower access is an
unusual pattern that admins should handle directly.

---

### 7.2 One Pending Request at a Time
A user cannot submit a new role request while they
have a pending one.

**Reason:** Multiple simultaneous pending requests
from the same user create confusion for reviewing
admins and serve no practical purpose.

---

### 7.3 Direct Role Change Auto Cancels Pending Requests
If admin directly updates a user role via the user
management API, any pending role requests from that
user are automatically rejected with the reviewing
admin and timestamp recorded.

**Reason:** Once the role is updated directly the
pending request is obsolete. Leaving it pending
would be misleading.

---

### 7.4 Viewer Cannot Request Viewer Role
The viewer role is excluded from requestedRole options.
Users can only request analyst or admin.

**Reason:** Viewer is the default role. Requesting
your own current role is meaningless.

---

## 8. General Assumptions

### 8.1 Single Currency
All transactions are assumed to be in the same
currency. No currency conversion or multi-currency
support is implemented.

**Reason:** Out of scope for this version.

---

### 8.2 No Email Notifications
No email notifications are sent for role request
approvals, rejections, or account status changes.

**Reason:** Out of scope for this version. Would
require integration with an email service such as
SendGrid or Nodemailer.

---

### 8.3 No Audit Logging
The system does not maintain a detailed audit log
of admin actions such as role changes, user
deactivation, or transaction modifications.

**Reason:** Out of scope for this version. In
production a full audit trail would be essential
for any financial system.

---

### 8.4 Local Development Only
This project is configured for local development.
Production deployment would additionally require:
- HTTPS enforcement
- Secret manager for credentials
- Redis for distributed caching and rate limiting
- Reverse proxy such as Nginx
- Process manager such as PM2
- Structured logging instead of morgan

---

## 9. Known Limitations

| Limitation | Impact | Production Fix |
|------------|--------|----------------|
| Role in JWT | Role changes need re-login | Accept tradeoff or use token blacklist |
| Orphaned createdBy | Returns null if creator deleted | Prevent user deletion or denormalize name |
| In-memory cache | Lost on restart, single instance only | Replace with Redis |
| In-memory rate limit | Single instance only | Replace with Redis store |
| No email notifications | Users not notified of updates | Integrate email service |
| No audit trail | Admin actions not logged | Add audit log collection |
| Single currency | Cannot handle multi-currency | Add currency field and conversion |
| No HTTPS | Insecure in production | Enforce HTTPS via Nginx |
| .env on GitHub | Credentials exposed publicly | Use .gitignore and secret manager |

---

## 10. Tradeoffs Summary

| Decision | Benefit | Tradeoff |
|----------|---------|----------|
| Role stored in JWT | No DB call per request | Role changes need re-login |
| Soft delete | Data preserved forever | DB grows over time |
| Free text categories | Maximum flexibility | No category consistency enforced |
| HttpOnly cookie auth | XSS protection | Requires same origin in production |
| MongoDB over SQL | Faster development | No strict relational constraints |
| In-memory cache | Simple zero-dependency setup | Not distributed, resets on restart |
| In-memory rate limit | Simple zero-dependency setup | Not distributed, resets on restart |
| Seed script for admin | Secure bootstrap process | Requires manual first run |
| .env pushed to GitHub | Easy evaluator setup | Security risk in production |
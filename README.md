# 🔐 Production Auth Backend System

> **A secure, modular, production-oriented authentication infrastructure for modern applications.**

A reusable authentication backend engineered with **Node.js, TypeScript, Express.js, PostgreSQL, Prisma ORM, Redis, JWT, and Argon2id** — built to handle the hard parts of authentication (identity, sessions, token security, account protection, password recovery, email verification, and auditing) while keeping application-specific business logic completely separate.

<div align="center">

**Authentication · Sessions · Tokens · Security · Recovery · Auditing**

</div>

---

## ✦ Why This Project?

Authentication is more than a `login` endpoint. A real system has to safely manage identity, credentials, sessions, token rotation, account security, and an audit trail — all without leaking implementation details into the rest of the application.

This project is designed as a **reusable authentication foundation** you can drop into SaaS platforms, dashboards, portals, and other backend systems, so you build authentication once and reuse it everywhere.

---

## 🚀 Core Capabilities

| Domain | Capabilities |
|---|---|
| 🔑 Authentication | Registration, Login, Logout, JWT Authentication |
| 🎫 Token Security | Access Tokens, Refresh Tokens, Rotation, Reuse Detection |
| 👤 Identity | Current User, Account Status, Email Verification |
| 🔐 Password | Change Password, Forgot Password, Secure Reset |
| 🖥️ Sessions | Multi-Session Tracking, Session Revocation, Logout All |
| 🛡️ Security | Rate Limiting, Helmet, CORS, Secure Cookies |
| 🚨 Account Protection | Failed Login Tracking, Temporary Lockout |
| 📋 Auditing | Authentication & Security Event Logging |
| ⚡ Infrastructure | PostgreSQL, Prisma ORM, Redis |
| 📖 API | Versioned REST API, OpenAPI / Swagger |

---

## 🧠 Architecture

```
Client
  │
  ▼
Express API
  │
  ▼
Middleware  →  Validation · Security · Rate Limit · Auth · RBAC
  │
  ▼
Controller
  │
  ▼
Service
  │
  ▼
Repository
  │
  ▼
Prisma ORM
  │
  ▼
PostgreSQL

Redis  →  Security State · Rate Limiting · Token State
```

---

## 🔐 Security Model

**Password Security**
- Argon2id password hashing
- Passwords never stored or exposed in plaintext
- Centralized password policy
- Secure password change / reset flows

**Token Security**
- Short-lived JWT access tokens
- Opaque, hashed refresh tokens
- Refresh token rotation
- Refresh token reuse detection
- Redis-backed security state
- Secure HttpOnly cookie support

**Account Protection**
- Failed login tracking
- Temporary account lockout
- Generic authentication errors (no user enumeration)
- Timing-attack protection
- Rate limiting on auth endpoints

---

## 🔄 Token Lifecycle

```
Login → Verify Credentials → Create Session
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                              ▼
             Access Token                   Refresh Token
             (short-lived)                  (long-lived, HttpOnly cookie)
                    │
                    ▼
             API Requests → JWT Middleware → Authenticated User

On Expiry → Refresh Endpoint → Validate Session
                                   │
                                   ▼
                         Rotate Refresh Token
                                   │
                                   ▼
                     New Access Token + New Refresh Token
```

### 🛡️ Refresh Token Reuse Detection

A previously rotated-out refresh token must never silently become valid again.

```
Old Refresh Token Used Again
            │
            ▼
     Reuse Detected
            │
            ▼
  Revoke Entire Session Family
            │
            ▼
   Create Security Audit Event
```

This protects against stolen refresh tokens being replayed after rotation.

---

## 👥 Session Management

Each session can track: **device, IP address, user agent, last used, created at, expiration, and revocation status.**

- View active sessions
- Revoke an individual session
- Logout from all sessions at once

---

## 📧 Account Recovery

**Email Verification**
```
Register → Verification Token → Hashed & Stored → Email Sent → Account Verified
```

**Password Reset**
```
Forgot Password → Secure Reset Token → Hashed & Stored → Reset Password
                                                                  │
                                                                  ▼
                                          Invalidate Token + Revoke Sessions
```

Sensitive tokens are never stored in plaintext.

---

## 📋 Security Audit Trail

Every authentication-relevant event is recorded:

`REGISTER` · `LOGIN_SUCCESS` · `LOGIN_FAILED` · `LOGOUT` · `LOGOUT_ALL` · `REFRESH_SUCCESS` · `REFRESH_REUSE_DETECTED` · `PASSWORD_CHANGED` · `PASSWORD_RESET_REQUESTED` · `PASSWORD_RESET_COMPLETED` · `EMAIL_VERIFIED` · `ACCOUNT_LOCKED` · `SESSION_REVOKED`

Records include user, IP address, user agent, event type, timestamp, and safe metadata — **secrets and tokens are never logged.**

---

## 🧩 Project Structure

```
src/
├── config/          → env, database, redis, logger
├── modules/         → auth, users, sessions, password, verification, audit
├── middleware/       → auth, role, permission, rate-limit, validation, error, security
├── services/         → token, password, redis, email
├── errors/
├── types/
├── utils/
├── routes/
├── docs/              → swagger.ts
├── app.ts
└── server.ts

prisma/
├── migrations/
├── schema.prisma
└── seed.ts
```

---

## 🛠️ Technology Stack

**Backend** — Node.js · TypeScript · Express.js
**Database** — PostgreSQL · Prisma ORM
**Auth & Security** — JWT · Argon2id · Redis · Zod · Helmet · CORS · HttpOnly Cookies
**Observability** — Pino · Request IDs · Health/Readiness Endpoints · Audit Logs
**Documentation** — OpenAPI · Swagger UI

---

## 📡 API Reference

Base URL: `http://localhost:5000`

**Authentication**
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/logout-all
GET    /api/v1/auth/me
```

**Email Verification**
```
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/resend-verification
```

**Password**
```
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/change-password
```

**Sessions**
```
GET    /api/v1/auth/sessions
DELETE /api/v1/auth/sessions/:sessionId
```

Interactive docs: `http://localhost:5000/docs`
OpenAPI spec: `http://localhost:5000/docs.json`

---

## ⚙️ Environment Configuration

Create a `.env` file from `.env.example`:

```env
NODE_ENV=development
PORT=5000

DATABASE_URL=
REDIS_URL=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

ALLOWED_ORIGINS=

MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15

RATE_LIMIT_WINDOW_MS=
RATE_LIMIT_MAX=

EMAIL_PROVIDER=
EMAIL_FROM=
```

⚠️ Never commit `.env` or production credentials to version control.

---

## 🗄️ Database

Core entities, managed through Prisma migrations:

```
User
 ├── Session
 ├── EmailVerificationToken
 ├── PasswordResetToken
 └── AuditLog

Role
 └── Permission
```

## ⚡ Redis

Used for temporary, non-persistent authentication state: rate limiting, token security state, JTI blacklisting. PostgreSQL remains the source of truth for persistent data.

## 🏥 Health & Readiness

```
GET /health   → application liveness
GET /ready    → verifies PostgreSQL and Redis connectivity
```

---

## ▶️ Getting Started

```bash
# 1. Clone
git clone https://github.com/jeromelarens/production-auth-backend-system.git
cd production-auth-backend-system

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# → add your PostgreSQL and Redis configuration

# 4. Generate Prisma Client
npx prisma generate

# 5. Run migrations
npx prisma migrate dev

# 6. Start development server
npm run dev
```

Server: `http://localhost:5000`
Swagger: `http://localhost:5000/docs`

---

## 🧭 Design Principles

Security First → Explicit Boundaries → Modular Design → Minimal Coupling → Strong Validation → Auditable Authentication → Reusable Infrastructure

The authentication layer is intentionally separated from application-specific business logic.

## 🎯 Intended Use

Built to integrate into SaaS applications, e-commerce platforms, job portals, learning platforms, enterprise applications, admin dashboards, and mobile application backends.

> Build authentication once. Reuse it across applications.

## 📌 Project Status

**Production-oriented authentication infrastructure.**

Designed around secure authentication flows, modular architecture, session security, token lifecycle management, account recovery, and auditing. Before deploying to a real production environment, configure environment-specific secrets, infrastructure security, transactional email delivery, database security, and operational monitoring.

---

## 👨‍💻 Author

**Jerome Larens**
Backend developer focused on building secure and scalable backend systems.

[GitHub](https://github.com/jeromelarens)

<div align="center">

🔐 *Identity is the foundation of every application.*

**Production Auth Backend System**
Built with security. Designed for reuse. Engineered for scale.

</div>

# Production Auth Backend System

Production-grade authentication backend built with Node.js, Express.js, PostgreSQL, Prisma ORM, Redis, JWT, and Argon2id.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture & Authentication Flow](#architecture--authentication-flow)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Database & Prisma Setup](#database--prisma-setup)
- [Redis Integration](#redis-integration)
- [Local Development Setup](#local-development-setup)
- [Interactive Swagger Documentation](#interactive-swagger-documentation)
- [Security Features](#security-features)
- [Documentation Index](#documentation-index)

---

## Overview

The **Production Auth Backend System** is an enterprise-ready, standalone authentication microservice designed to provide secure identity, session, and credential management for modern web and mobile applications. It implements dual-token (JWT + rotated refresh token) lifecycle management, cryptographic hashing, account lockout mechanisms, and compliance audit logging.

---

## Key Features

- **Dual-Token Authentication**: Short-lived JWT Access Tokens (15 min) paired with single-use, rotated Refresh Tokens (7 days).
- **Refresh Token Rotation & Reuse Detection**: Automatic breach containment revokes all active user sessions if a compromised refresh token is replayed.
- **Argon2id & Bcrypt Password Hashing**: Memory-hard password hashing with GPU resistance and side-channel timing attack mitigation.
- **Prisma ORM & PostgreSQL**: 100% type-safe database queries with structured migrations, connection pooling, and relational schemas.
- **Session Management & Device Tracking**: Multi-device support with IP logging, user-agent parsing, and granular remote session revocation.
- **Account Lockout Protection**: Automatic account lockout following consecutive failed login attempts to neutralize brute-force attacks.
- **Email Verification & Password Reset**: Secure token workflows stored with SHA-256 database hashing.
- **Security Audit Logging**: Structured security event logging tracking sensitive actions and identity events.
- **OpenAPI 3.0 / Swagger UI**: Built-in interactive API documentation at `/docs` and raw JSON spec at `/docs.json`.
- **Production Defense**: Helmet security headers, CORS origin whitelisting, HTTP-only SameSite cookies, request ID tracing, and rate limiting.

---

## Technology Stack

- **Runtime**: Node.js (v18+) & TypeScript (v5+)
- **Web Framework**: Express.js
- **Database & ORM**: PostgreSQL & Prisma ORM (@prisma/client, @prisma/adapter-pg)
- **Caching & KV Store**: Redis (ioredis) with standalone resilience fallback
- **Authentication**: JSON Web Tokens (jsonwebtoken), Argon2 (argon2), Bcrypt (bcryptjs)
- **Validation**: Zod schema validation
- **Security**: Helmet, CORS, Cookie-Parser, Express-Rate-Limit
- **Logging**: Pino & Pino-HTTP structured asynchronous logging
- **Documentation**: Swagger UI Express & OpenAPI 3.0.3

---

## Architecture & Authentication Flow

### Dual-Token Lifecycle

```
[Client]                                                          [Server]
   │                                                                 │
   │── 1. POST /api/v1/auth/login (email, password) ────────────────►│
   │                                                                 ├─ Verify Argon2id Hash
   │                                                                 ├─ Issue Access Token (15m, JWT)
   │                                                                 ├─ Issue Refresh Token (7d, Opaque)
   │                                                                 └─ Save SHA-256(RefreshToken) in DB
   │◄── 2. Return Access Token & Set HttpOnly Refresh Cookie ────────│
   │                                                                 │
   │── 3. GET /api/v1/auth/me (Bearer Access Token) ────────────────►│
   │                                                                 ├─ Verify JWT & Check User Status
   │◄── 4. Return User Identity ─────────────────────────────────────│
   │                                                                 │
   │ (Access Token Expires after 15m)                                │
   │                                                                 │
   │── 5. POST /api/v1/auth/refresh (Cookie or Body) ───────────────►│
   │                                                                 ├─ Hash token & locate Session
   │                                                                 ├─ Check Revocation (Reuse Detection)
   │                                                                 ├─ Invalidate old & issue new token
   │◄── 6. Return New Access Token + Rotated Refresh Token ──────────│
```

---

## API Endpoints

### System Probes
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Liveness health check | Public |
| `GET` | `/ready` | Database & Redis readiness status | Public |
| `GET` | `/docs` | Interactive Swagger UI documentation | Public |
| `GET` | `/docs.json` | OpenAPI 3.0.3 JSON Specification | Public |

### Authentication Routes (`/api/v1/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register new user account | No (Rate Limited) |
| `POST` | `/api/v1/auth/login` | Authenticate user & issue tokens | No (Rate Limited) |
| `POST` | `/api/v1/auth/refresh` | Rotate refresh token for new access token | No / Cookie |
| `POST` | `/api/v1/auth/verify-email` | Verify email with confirmation token | No |
| `POST` | `/api/v1/auth/resend-verification` | Resend verification email | No (Rate Limited) |
| `POST` | `/api/v1/auth/logout` | Revoke current session & clear cookies | Bearer JWT |
| `POST` | `/api/v1/auth/logout-all` | Revoke all active sessions across all devices | Bearer JWT |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile & roles | Bearer JWT |
| `GET` | `/api/v1/auth/sessions` | List active sessions and device info | Bearer JWT |
| `DELETE` | `/api/v1/auth/sessions/:id` | Revoke a specific active session | Bearer JWT |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset token | No (Rate Limited) |
| `POST` | `/api/v1/auth/reset-password` | Reset password using reset token | No (Rate Limited) |
| `POST` | `/api/v1/auth/change-password` | Change password for logged-in user | Bearer JWT |

---

## Environment Variables

Copy `.env.example` to create your local `.env` configuration:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment (`development`, `production`, `test`) | `development` |
| `PORT` | Server listening port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | *Required* |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `REDIS_ENABLED` | Toggle Redis connection (`true` / `false`) | `false` |
| `JWT_ACCESS_SECRET` | Secret key for signing JWT access tokens (min 16 chars) | *Required in Prod* |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens (min 16 chars) | *Required in Prod* |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifespan | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifespan | `7d` |
| `COOKIE_SECRET` | Secret key for signing cookies | *Required in Prod* |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | `http://localhost:3000,http://localhost:5173` |
| `MAX_LOGIN_ATTEMPTS` | Failed attempts before temporary account lockout | `5` |
| `LOCKOUT_DURATION_MINUTES` | Account lockout duration in minutes | `15` |
| `RATE_LIMIT_WINDOW_MS` | General rate limit window in milliseconds | `900000` (15m) |
| `RATE_LIMIT_MAX` | Max general requests per rate limit window | `100` |
| `AUTH_RATE_LIMIT_MAX` | Max auth requests per rate limit window | `15` |
| `EMAIL_PROVIDER` | Email driver (`console`, `mock`, `smtp`, `sendgrid`) | `console` |
| `EMAIL_FROM` | Default sender email address | `noreply@authservice.local` |

---

## Database & Prisma Setup

This project uses **Prisma ORM** with PostgreSQL.

1. **Push Schema to Database**:
   ```bash
   npx prisma db push
   ```

2. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Seed Initial Roles & Admin (Optional)**:
   ```bash
   npm run prisma:seed
   ```

---

## Redis Integration

- **Session Caching & Blacklisting**: Used for high-speed token and session state lookups.
- **Fault-Tolerant Fallback**: If Redis is not enabled or becomes unreachable, the service gracefully degrades to standalone mode and queries PostgreSQL directly without throwing fatal errors.

---

## Local Development Setup

### 1. Prerequisites
- Node.js (v18.0.0 or higher)
- PostgreSQL (Local or Cloud instance e.g., Neon, Supabase, AWS RDS)
- Redis (Optional, local instance or Redis Cloud)

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration
```bash
cp .env.example .env
# Update .env with your PostgreSQL credentials
```

### 4. Database Initialization
```bash
npx prisma generate
npx prisma db push
```

### 5. Start Development Server
```bash
npm run dev
```

The server will be available at `http://localhost:5000`.

---

## Interactive Swagger Documentation

- **Swagger UI**: [http://localhost:5000/docs](http://localhost:5000/docs)
- **OpenAPI 3.0 Specification**: [http://localhost:5000/docs.json](http://localhost:5000/docs.json)

---

## Security Features

1. **Argon2id Hashing**: High memory and computation cost preventing offline GPU and ASIC dictionary attacks.
2. **SHA-256 Token Storage**: Plaintext tokens (refresh, reset, verification) are never stored in the database.
3. **HTTP-Only Cookies**: Refresh tokens are isolated from client-side JavaScript, protecting against XSS exploitation.
4. **Brute-Force & Lockout Defenses**: Tiered IP rate limiting with account-level lockouts.
5. **Audit Logging**: Comprehensive security event recording for incident response and compliance.
6. **Request ID Tracking**: Every HTTP request receives an `x-request-id` header for end-to-end tracing across distributed services.

---

## Documentation Index

- [API Reference](docs/API.md)
- [Authentication Architecture & Mechanics](docs/AUTHENTICATION.md)
- [Security Model & Threat Mitigation](docs/SECURITY.md)
- [System Architecture & Design](docs/ARCHITECTURE.md)

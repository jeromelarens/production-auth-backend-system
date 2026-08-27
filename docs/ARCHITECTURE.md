# System Architecture & Design

## 1. High-Level Architecture

The **Production Authentication Platform** is designed as a standalone, decoupled microservice providing identity, session, and security management for modern web and mobile clients.

```
                  +-----------------------------------+
                  |   Web / Mobile / API Clients      |
                  +-----------------+-----------------+
                                    |
                            HTTP / HTTPS (JSON)
                                    |
                                    v
+-----------------------------------------------------------------------+
|                      EXPRESS.JS APPLICATION GATEWAY                   |
|                                                                       |
|  [Request ID] -> [Pino Logger] -> [Helmet / CORS] -> [Rate Limiters]  |
|                                                                       |
|  +-------------------+  +--------------------+  +------------------+  |
|  | OpenAPI / Swagger |  | Health / Readiness |  | Global Error     |  |
|  | Documentation UI  |  | Diagnostic Probes  |  | Response Handler |  |
|  +-------------------+  +--------------------+  +------------------+  |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  |                      VERSIONED API ROUTING (/api/v1)            |  |
|  |                                                                 |  |
|  |  - /auth/register              - /auth/logout                   |  |
|  |  - /auth/login                 - /auth/logout-all               |  |
|  |  - /auth/refresh               - /auth/me                       |  |
|  |  - /auth/verify-email          - /auth/sessions                 |  |
|  |  - /auth/resend-verification   - /auth/forgot-password          |  |
|  |  - /auth/change-password       - /auth/reset-password           |  |
|  +-----------------------------------------------------------------+  |
+-----------------------------------+-----------------------------------+
                                    |
           +------------------------+------------------------+
           |                                                 |
           v                                                 v
+-----------------------+                         +---------------------+
|      PostgreSQL       |                         |    Redis (Cache)    |
|   (Relational DB)     |                         |  (Token Blacklist/  |
|                       |                         |   Rate Limiting)    |
| - Users & Credentials |                         +---------------------+
| - Active Sessions     |
| - Audit Logs          |
| - Roles & Permissions |
+-----------------------+
```

---

## 2. Layered Architecture Design

The service follows strict separation of concerns across layered modules:

1. **Routing Layer (`src/routes/` & `src/modules/*/` routes)**:
   - Maps HTTP verbs and URI paths to corresponding controllers.
   - Attaches route-level middlewares (e.g., Zod schema validation, JWT auth, rate limits).

2. **Controller Layer (`src/controllers/` & `src/modules/*/` controllers)**:
   - Unpacks HTTP request parameters, body, headers, and cookies.
   - Invokes business logic services.
   - Formats uniform responses via `ResponseFormatter`.

3. **Service Layer (`src/services/` & `src/modules/*/` services)**:
   - Contains core business logic (token generation, hashing, session management, breach detection).
   - Coordinates database transactions and cache operations.

4. **Data Access Layer (`prisma/schema.prisma` & Repositories)**:
   - Type-safe query abstraction using Prisma ORM with connection pooling.
   - Zero raw SQL CRUD operations.

5. **Cross-Cutting Concerns (`src/middleware/`, `src/config/`, `src/utils/`)**:
   - Centralized error handling and standard exception hierarchies (`AppError`).
   - High-throughput asynchronous logging with Pino.
   - Security headers with Helmet and strict CORS configurations.

---

## 3. Database Schema Overview

```
+---------------+       +------------------+       +-------------------+
|     User      | 1───* |     Session      | 1───* |    RefreshToken   |
+---------------+       +------------------+       +-------------------+
| id (UUID)     |       | id (UUID)        |       | id (UUID)         |
| email         |       | userId           |       | sessionId         |
| passwordHash  |       | userAgent        |       | tokenHash         |
| role          |       | ipAddress        |       | expiresAt         |
| isActive      |       | isRevoked        |       | revokedAt         |
| isVerified    |       | lastActivityAt   |       | createdAt         |
+---------------+       +------------------+       +-------------------+
        │
        │ 1
        └───* +-------------------+
              |     AuditLog      |
              +-------------------+
              | id (UUID)         |
              | userId            |
              | event             |
              | ipAddress         |
              | metadata          |
              | createdAt         |
              +-------------------+
```

---

## 4. Resilience & Operational Stability

- **Graceful Shutdown**: Catches `SIGTERM` and `SIGINT` signals, closing the HTTP listener before disconnecting database pools and Redis clients.
- **Fail-Safe Startup**: Pre-flight checks verify database connectivity before binding HTTP ports.
- **Circuit-Tolerant Cache**: If Redis is unavailable, the service logs a structured warning and continues operating gracefully in standalone memory mode.

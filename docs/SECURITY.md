# Security Model & Threat Mitigation

| Threat Vector | Mitigation Strategy Implemented |
| :--- | :--- |
| **Brute Force / Credential Stuffing** | Tiered rate limiting via `express-rate-limit` + temporary account lockout (`failedLoginAttempts`, `lockedUntil`). |
| **User Enumeration** | Identical generic error responses (`AUTH_INVALID_CREDENTIALS: "Invalid email or password"`) for both incorrect passwords and non-existent accounts, combined with constant-time dummy verification. |
| **Token Theft & Replay** | Short-lived access tokens (15m) + Opaque refresh token rotation + Automatic session family revocation on reuse. |
| **Database Injection** | 100% Parameterized queries via **Prisma ORM**; zero raw SQL for application CRUD operations. |
| **Cross-Site Scripting (XSS)** | `HttpOnly`, `SameSite=Lax`, `Secure` cookies for refresh tokens + Helmet security headers. |
| **Cross-Origin Resource Sharing (CORS)** | Strict whitelist origin checking via environment variable `ALLOWED_ORIGINS`. |
| **Database Compromise (Stored Token Exposure)** | Plaintext refresh tokens, verification tokens, and password reset tokens are **never** stored in the database. Only their **SHA-256 hashes** are persisted. |
| **Memory / CPU Exhaustion (DoS)** | Strict payload size limits (`100kb`) and rate limiters per route category. |

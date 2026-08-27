# Authentication Architecture & Mechanics

## 1. Dual-Token Architecture

```
+-------------------------------------------------------------------------------+
|                             AUTHENTICATION FLOW                               |
+-------------------------------------------------------------------------------+

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
     │                                                                 ├─ Verify JWT & Check is_active
     │◄── 4. Return User Identity ─────────────────────────────────────│
     │                                                                 │
     │ (Access Token Expires after 15m)                                │
     │                                                                 │
     │── 5. POST /api/v1/auth/refresh (Cookie or Body) ───────────────►│
     │                                                                 ├─ Hash token & find Session
     │                                                                 ├─ Detect reuse (if revoked -> revoke family)
     │                                                                 ├─ Revoke old session & create new session
     │◄── 6. Return New Access Token + Rotated Refresh Token ──────────│
```

## 2. Refresh Token Rotation & Reuse Detection

1. **Rotation**: Every time a refresh token is exchanged at `/api/v1/auth/refresh`, the old refresh token is marked as `revokedAt = NOW()` and an entirely new refresh token is issued.
2. **Reuse Detection (RFC 6819 & OAuth 2.0 BCP)**: If an attacker intercepts an old refresh token and attempts to replay it, the server detects that the token was already revoked. It immediately triggers an **automatic breach containment protocol**, invalidating **all active sessions** for that user account and generating a critical audit event (`REFRESH_REUSE_DETECTED`).

## 3. Account Lockout Protection

- Failed login attempts are incremented per user.
- If failed attempts exceed `MAX_LOGIN_ATTEMPTS` (default: 5), the account is locked for `LOCKOUT_DURATION_MINUTES` (default: 15).
- Timing attacks are neutralized by executing dummy Argon2 verifications for non-existent users.

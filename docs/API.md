# Authentication Platform API Reference

Base URL: `http://localhost:5000/api/v1`  
Interactive Swagger Docs: `http://localhost:5000/docs`

---

## Response Envelope Standard

All responses adhere to a consistent JSON envelope format:

### Success Response (`2xx`)
```json
{
  "success": true,
  "data": { ... },
  "requestId": "c1f7a2d8-..."
}
```

### Error Response (`4xx` / `5xx`)
```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "Invalid email or password",
    "details": []
  },
  "requestId": "c1f7a2d8-..."
}
```

---

## 1. System & Health Probes

### Liveness Probe
`GET /health`  
Returns 200 OK if the application server is up.

### Readiness Probe
`GET /ready`  
Returns 200 OK if PostgreSQL database and Redis connections are live.

---

## 2. Authentication Endpoints

### 2.1 User Registration
* **Endpoint:** `POST /api/v1/auth/register`
* **Rate Limit:** 10 requests / hour / IP
* **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
* **Response:** `201 Created`

### 2.2 User Login
* **Endpoint:** `POST /api/v1/auth/login`
* **Rate Limit:** 15 requests / 15 mins / IP
* **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "SecurePassword123"
  }
  ```
* **Response:** `200 OK` (Returns Access Token, Refresh Token, and sets `HttpOnly` Secure Cookie)

### 2.3 Refresh Token Rotation
* **Endpoint:** `POST /api/v1/auth/refresh`
* **Request Body (Optional if Cookie present):**
  ```json
  {
    "refreshToken": "..."
  }
  ```
* **Response:** `200 OK` (Issues new Access Token and rotated Refresh Token)

### 2.4 Logout
* **Endpoint:** `POST /api/v1/auth/logout`
* **Auth:** Bearer Token or Refresh Cookie
* **Response:** `200 OK` (Revokes session and clears cookies)

### 2.5 Logout All Devices
* **Endpoint:** `POST /api/v1/auth/logout-all`
* **Auth:** Bearer Token
* **Response:** `200 OK` (Revokes all active sessions for authenticated user)

---

## 3. User Identity & Sessions

### 3.1 Get Current User Identity
* **Endpoint:** `GET /api/v1/auth/me`
* **Auth:** `Bearer <accessToken>`
* **Response:** `200 OK` with user profile and roles.

### 3.2 List Active Sessions
* **Endpoint:** `GET /api/v1/auth/sessions`
* **Auth:** `Bearer <accessToken>`
* **Response:** `200 OK` with list of user devices, IP addresses, and last activity timestamps.

### 3.3 Revoke Session
* **Endpoint:** `DELETE /api/v1/auth/sessions/:sessionId`
* **Auth:** `Bearer <accessToken>`
* **Response:** `200 OK`

---

## 4. Password Management

### 4.1 Forgot Password
* **Endpoint:** `POST /api/v1/auth/forgot-password`
* **Rate Limit:** 5 requests / 15 mins / IP
* **Request Body:** `{ "email": "user@example.com" }`

### 4.2 Reset Password
* **Endpoint:** `POST /api/v1/auth/reset-password`
* **Rate Limit:** 5 requests / 15 mins / IP
* **Request Body:** `{ "token": "...", "newPassword": "NewSecurePassword123" }`

### 4.3 Change Password
* **Endpoint:** `POST /api/v1/auth/change-password`
* **Auth:** `Bearer <accessToken>`
* **Request Body:** `{ "currentPassword": "...", "newPassword": "..." }`

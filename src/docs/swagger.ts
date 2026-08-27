import { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";

export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Production Authentication Service API",
    version: "1.0.0",
    description:
      "Enterprise-grade, standalone authentication backend service providing JWT Access Tokens, Refresh Token Rotation, Session Management, Account Lockout, and Email Verification.",
  },
  servers: [
    {
      url: "/api/v1",
      description: "API Version 1",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT access token",
      },
    },
    schemas: {
      ApiResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object" },
          requestId: { type: "string" },
        },
      },
      ApiError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "AUTH_INVALID_CREDENTIALS" },
              message: { type: "string", example: "Invalid email or password" },
              details: { type: "array", items: { type: "object" } },
            },
          },
          requestId: { type: "string" },
        },
      },
      RegisterRequest: {
        type: "object",
        required: ["email", "password", "firstName", "lastName"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
          password: { type: "string", format: "password", example: "SecurePass123" },
          firstName: { type: "string", example: "John" },
          lastName: { type: "string", example: "Doe" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
          password: { type: "string", format: "password", example: "SecurePass123" },
        },
      },
      RefreshTokenRequest: {
        type: "object",
        properties: {
          refreshToken: { type: "string", description: "Optional if provided via HttpOnly cookie" },
        },
      },
      ResendVerificationRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
        },
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", example: "user@example.com" },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["token", "newPassword"],
        properties: {
          token: { type: "string", example: "reset-token-uuid-or-jwt" },
          newPassword: { type: "string", format: "password", example: "NewSecurePass123" },
        },
      },
      ChangePasswordRequest: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: { type: "string", format: "password", example: "CurrentPass123" },
          newPassword: { type: "string", format: "password", example: "NewSecurePass123" },
        },
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        summary: "Register a new user",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterRequest" } } },
        },
        responses: {
          201: { description: "User registered successfully" },
          400: { description: "Validation error" },
          409: { description: "Email already exists" },
        },
      },
    },
    "/auth/login": {
      post: {
        summary: "Authenticate user and generate Access & Refresh tokens",
        tags: ["Authentication"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
        },
        responses: {
          200: { description: "Login successful with token pair" },
          401: { description: "Invalid credentials" },
          429: { description: "Account locked or rate limit exceeded" },
        },
      },
    },
    "/auth/refresh": {
      post: {
        summary: "Rotate refresh token and issue new access token",
        tags: ["Authentication"],
        requestBody: {
          required: false,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RefreshTokenRequest" } } },
        },
        responses: {
          200: { description: "Tokens refreshed successfully" },
          401: { description: "Invalid or reused refresh token" },
        },
      },
    },
    "/auth/verify-email": {
      post: {
        summary: "Verify user email address using token",
        tags: ["Verification"],
        parameters: [
          {
            name: "token",
            in: "query",
            required: false,
            schema: { type: "string" },
            description: "Verification token sent via email",
          },
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { token: { type: "string" } },
              },
            },
          },
        },
        responses: {
          200: { description: "Email successfully verified" },
          400: { description: "Invalid or expired token" },
        },
      },
    },
    "/auth/resend-verification": {
      post: {
        summary: "Resend verification email",
        tags: ["Verification"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ResendVerificationRequest" } } },
        },
        responses: {
          200: { description: "Verification email sent if account exists" },
          429: { description: "Rate limit exceeded" },
        },
      },
    },
    "/auth/logout": {
      post: {
        summary: "Log out current session",
        tags: ["Authentication"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Logged out successfully" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/auth/logout-all": {
      post: {
        summary: "Revoke all active sessions for current user",
        tags: ["Authentication"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "All sessions revoked successfully" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/auth/me": {
      get: {
        summary: "Get current authenticated user profile",
        tags: ["User"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "User profile data" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        summary: "Request password reset email",
        tags: ["Password"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ForgotPasswordRequest" } } },
        },
        responses: {
          200: { description: "Password reset link sent if account exists" },
          429: { description: "Rate limit exceeded" },
        },
      },
    },
    "/auth/reset-password": {
      post: {
        summary: "Reset password using reset token",
        tags: ["Password"],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ResetPasswordRequest" } } },
        },
        responses: {
          200: { description: "Password reset successful" },
          400: { description: "Invalid or expired token" },
        },
      },
    },
    "/auth/change-password": {
      post: {
        summary: "Change password for authenticated user",
        tags: ["Password"],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ChangePasswordRequest" } } },
        },
        responses: {
          200: { description: "Password changed successfully" },
          400: { description: "Invalid current password or validation error" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/auth/sessions": {
      get: {
        summary: "List all active sessions for current user",
        tags: ["Sessions"],
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "List of active sessions" },
          401: { description: "Unauthorized" },
        },
      },
    },
    "/auth/sessions/{sessionId}": {
      delete: {
        summary: "Revoke a specific user session",
        tags: ["Sessions"],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: "sessionId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          200: { description: "Session revoked" },
          401: { description: "Unauthorized" },
          403: { description: "Forbidden" },
          404: { description: "Session not found" },
        },
      },
    },
  },
};

export const setupSwagger = (app: Express): void => {
  const swaggerOptions = {
    explorer: true,
    customSiteTitle: "Authentication API Documentation",
  };

  // Raw OpenAPI JSON endpoints (registered before UI handlers)
  app.get("/docs.json", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(swaggerDocument);
  });

  app.get("/api-docs.json", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(swaggerDocument);
  });

  // Mount Swagger UI
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, swaggerOptions)
  );

  // Optional compatibility alias
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, swaggerOptions)
  );
};


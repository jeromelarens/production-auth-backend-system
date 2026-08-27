import crypto from "crypto";

/**
 * Generate a cryptographically secure random hexadecimal token.
 *
 * @param bytes - Number of random bytes (default 32 -> 64 hex chars)
 */
export function generateRandomToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Compute the SHA-256 hash of a string or token.
 * Raw tokens should never be stored in the database.
 *
 * @param token - Token or string to hash
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Constant-time string comparison to prevent timing attacks.
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

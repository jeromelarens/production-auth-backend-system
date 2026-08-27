import argon2 from "argon2";
import bcrypt from "bcryptjs";
import { logger } from "../config/logger";

export class PasswordService {
  /**
   * Hash a plain-text password using Argon2id with memory cost and parallelism.
   * Falls back gracefully to bcrypt if Argon2 fails on any platform.
   */
  static async hash(password: string): Promise<string> {
    try {
      return await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 65536, // 64 MB
        timeCost: 3,
        parallelism: 4,
      });
    } catch (err: any) {
      logger.warn(`Argon2 hashing fallback to bcrypt: ${err.message}`);
      const salt = await bcrypt.genSalt(12);
      return bcrypt.hash(password, salt);
    }
  }

  /**
   * Verify a plaintext password against an Argon2 or Bcrypt hash.
   */
  static async verify(password: string, hash: string): Promise<boolean> {
    try {
      if (hash.startsWith("$argon2")) {
        return await argon2.verify(hash, password);
      }
      return await bcrypt.compare(password, hash);
    } catch (err: any) {
      logger.error(`Password verification error: ${err.message}`);
      return false;
    }
  }
}

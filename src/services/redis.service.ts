import { redisManager } from "../config/redis";
import { logger } from "../config/logger";

export class RedisService {
  /**
   * Set a key with TTL (in seconds).
   */
  static async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    const client = redisManager.getClient();
    if (!client) return;

    try {
      await client.setex(key, ttlSeconds, value);
    } catch (err: any) {
      logger.warn(`Redis set failed for key ${key}: ${err.message}`);
    }
  }

  /**
   * Get a key value.
   */
  static async get(key: string): Promise<string | null> {
    const client = redisManager.getClient();
    if (!client) return null;

    try {
      return await client.get(key);
    } catch (err: any) {
      logger.warn(`Redis get failed for key ${key}: ${err.message}`);
      return null;
    }
  }

  /**
   * Delete a key.
   */
  static async del(key: string): Promise<void> {
    const client = redisManager.getClient();
    if (!client) return;

    try {
      await client.del(key);
    } catch (err: any) {
      logger.warn(`Redis del failed for key ${key}: ${err.message}`);
    }
  }

  /**
   * Blacklist an access token JTI until token expiry.
   */
  static async blacklistToken(jti: string, ttlSeconds: number = 900): Promise<void> {
    await this.set(`blacklist:jti:${jti}`, "revoked", ttlSeconds);
  }

  /**
   * Check if an access token JTI is blacklisted.
   */
  static async isTokenBlacklisted(jti: string): Promise<boolean> {
    const val = await this.get(`blacklist:jti:${jti}`);
    return val === "revoked";
  }
}

import Redis from "ioredis";
import { logger } from "./logger";
import { env } from "./env";

class RedisClientManager {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  constructor() {
    if (env.REDIS_ENABLED) {
      try {
        this.client = new Redis(env.REDIS_URL, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          retryStrategy(times) {
            if (times > 3) {
              return null; // Stop retrying after 3 attempts
            }
            return Math.min(times * 200, 1000);
          },
        });

        this.client.on("connect", () => {
          this.isConnected = true;
          logger.info("[REDIS] Connected successfully");
        });

        this.client.on("error", (err) => {
          this.isConnected = false;
          logger.warn(`[REDIS] Error: ${err.message}`);
        });

        this.client.on("close", () => {
          this.isConnected = false;
        });
      } catch (err: any) {
        logger.warn(`[REDIS] Could not initialize client: ${err.message}`);
      }
    }
  }

  public async connect(): Promise<void> {
    if (this.client && env.REDIS_ENABLED) {
      try {
        await this.client.connect();
      } catch (err: any) {
        logger.warn(`[REDIS] Unavailable (${err.message}). Continuing in standalone mode.`);
      }
    }
  }

  public getClient(): Redis | null {
    return this.isConnected ? this.client : null;
  }

  public async isHealthy(): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;
    try {
      const pong = await this.client.ping();
      return pong === "PONG";
    } catch {
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        logger.info("[REDIS] Client disconnected");
      } catch {}
    }
  }
}

export const redisManager = new RedisClientManager();

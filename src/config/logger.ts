import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    env.NODE_ENV !== "production" && env.NODE_ENV !== "test"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.currentPassword",
      "req.body.newPassword",
      "password",
      "token",
      "refreshToken",
    ],
    remove: true,
  },
});

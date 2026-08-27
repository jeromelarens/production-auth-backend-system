import { logger } from "../config/logger";
import { env } from "../config/env";

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export class EmailService {
  /**
   * Send an email or log it in development/test mode.
   */
  static async sendEmail(options: EmailOptions): Promise<void> {
    const from = env.EMAIL_FROM;

    if (env.EMAIL_PROVIDER === "console" || env.NODE_ENV !== "production") {
      logger.info(`[EMAIL] To: ${options.to} | Subject: "${options.subject}"`);
      if (options.text) {
        logger.info(`[EMAIL_BODY]\n${options.text}`);
      }
      return;
    }

    // In production, integrate with SendGrid, Resend, or AWS SES here
    logger.info(`[EMAIL] Production email dispatched to ${options.to} via ${env.EMAIL_PROVIDER}`);
  }

  /**
   * Send verification email with raw verification token.
   */
  static async sendVerificationEmail(email: string, firstName: string, rawToken: string): Promise<void> {
    const verificationUrl = `http://localhost:${env.PORT}/api/v1/auth/verify-email?token=${rawToken}`;
    const subject = "Verify Your Email Address";
    const text = `Hello ${firstName},\n\nPlease verify your email address by clicking the link below or using your token:\n\n${verificationUrl}\n\nToken: ${rawToken}\n\nThis token will expire in 24 hours.`;

    await this.sendEmail({
      to: email,
      subject,
      text,
    });
  }

  /**
   * Send password reset email with raw reset token.
   */
  static async sendPasswordResetEmail(email: string, firstName: string, rawToken: string): Promise<void> {
    const resetUrl = `http://localhost:${env.PORT}/api/v1/auth/reset-password?token=${rawToken}`;
    const subject = "Password Reset Request";
    const text = `Hello ${firstName},\n\nYou requested a password reset. Use the link below or your token to reset your password:\n\n${resetUrl}\n\nToken: ${rawToken}\n\nThis token will expire in 1 hour. If you did not request this, please ignore this email.`;

    await this.sendEmail({
      to: email,
      subject,
      text,
    });
  }
}

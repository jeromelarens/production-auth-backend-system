export interface CreateVerificationTokenParams {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

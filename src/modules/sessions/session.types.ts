export interface CreateSessionParams {
  userId: string;
  refreshTokenHash: string;
  deviceName?: string | null;
  userAgent?: string | null;
  ipAddress?: string | null;
  expiresAt: Date;
}

export interface SessionResponseDTO {
  id: string;
  deviceName: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  lastUsedAt: Date;
  expiresAt: Date;
  isCurrent?: boolean;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: AuthenticatedUser;
      sessionId?: string;
      tokenJti?: string;
    }
  }
}

export {};

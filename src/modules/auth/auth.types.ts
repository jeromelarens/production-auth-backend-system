export interface RegisterDTO {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthTokensDTO {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    isEmailVerified: boolean;
    roles: string[];
  };
}

export interface RefreshResultDTO {
  accessToken: string;
  refreshToken: string;
}

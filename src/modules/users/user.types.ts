export interface UserResponseDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isEmailVerified: boolean;
  roles: string[];
  lastLoginAt: Date | null;
  createdAt: Date;
}

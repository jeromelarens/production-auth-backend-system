import { UserRepository } from "./user.repository";
import { UserResponseDTO } from "./user.types";
import { NotFoundError } from "../../errors/AuthError";

export class UserService {
  static async getCurrentUserProfile(userId: string): Promise<UserResponseDTO> {
    const user = await UserRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new NotFoundError("User not found or account is inactive");
    }

    const roles = user.roles.map((r) => r.role.name.toString());

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      roles,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}

// Mirrors backend DTOs (Body4uHUB.Identity.Application/DTOs). JSON is camelCase; DateTime → ISO string.
export interface RoleDto {
  id: string;
  name: RoleName | string;
}

export type RoleName = "User" | "Trainer" | "Administrator";

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  createdAt: string;
  isEmailConfirmed: boolean;
  roles: RoleDto[];
}

export interface AuthResponseDto {
  accessToken: string;
  user: UserDto;
}

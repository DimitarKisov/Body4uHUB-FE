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
  /** JWT, 15 min. The refresh token is never in the body: it is an HttpOnly cookie (b4u_refresh). */
  accessToken: string;
  user: UserDto;
  /** UTC, no "Z": the session ends then at the latest (30 days after sign-in), however active the user is. */
  sessionExpiresAt: string;
}

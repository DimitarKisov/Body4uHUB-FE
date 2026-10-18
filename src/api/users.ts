// Identity API — UserController (backend/Body4uHUB.Identity.Api/Controllers/UserController.cs). All calls need a bearer token.
import { api } from "@/api/client";
import type { UserDto } from "@/api/types";

/** 200 UserDto · 401 (global: sign out) · 404 user no longer exists. */
export const getMe = () => api<UserDto>("/api/users/me");
export const meQueryKey = ["users", "me"] as const;

export interface EditUserRequest {
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
}

/** 204 · 400 validation · 401 (global: sign out) · 404 user no longer exists · 422 domain rule broken. Email can't be changed. */
export const updateMe = (body: EditUserRequest) => api("/api/users/me", { method: "PUT", body });

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** 204 · 400 validation (incl. new = current) · 401 (global: sign out) · 404 user no longer exists · 422 wrong current password. */
export const changePassword = (body: ChangePasswordRequest) => api("/api/users/me/change-password", { method: "POST", body });

/** Shared PagedResult<T> (Body4uHUB.Shared.Application). */
export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** GetAllUsersResponse — no roles (the "Роли" column is reserved). */
export interface UserListItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  createdAt: string;
  isEmailConfirmed: boolean;
}

/** Admin only. 200 PagedResult (ordered by registration date) · 400 bad page/size · 401 (global: sign out) · 403 not an admin. */
export const getUsers = (page: number, pageSize: number) => api<PagedResult<UserListItem>>(`/api/users?page=${page}&pageSize=${pageSize}`);
export const usersQueryKey = (page: number, pageSize: number) => ["users", "list", page, pageSize] as const;

/** Admin only. 200 UserDto · 401 (global: sign out) · 403 not an admin · 404 no such user (also for a malformed id). */
export const getUser = (id: string) => api<UserDto>(`/api/users/${encodeURIComponent(id)}`);
export const userQueryKey = (id: string) => ["users", "detail", id] as const;

/** Admin only. 204 · 400 empty list · 401 · 403 · 404 user or a role doesn't exist · 422 Trainer (only via "Направи треньор"). Roles the user has are skipped. */
export const addUserRoles = (userId: string, roleIds: string[]) =>
  api(`/api/users/${encodeURIComponent(userId)}/roles`, { method: "POST", body: { roleIds } });

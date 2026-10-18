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

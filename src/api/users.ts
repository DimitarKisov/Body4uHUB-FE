// Identity API — UserController (backend/Body4uHUB.Identity.Api/Controllers/UserController.cs). All calls need a bearer token.
import { api } from "@/api/client";
import type { UserDto } from "@/api/types";

/** 200 UserDto · 401 (global: sign out) · 404 user no longer exists. */
export const getMe = () => api<UserDto>("/api/users/me");
export const meQueryKey = ["users", "me"] as const;

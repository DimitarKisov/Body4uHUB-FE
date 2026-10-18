// Identity API — RoleController (backend/Body4uHUB.Identity.Api/Controllers/RoleController.cs). Admin only.
import { api } from "@/api/client";
import type { RoleDto } from "@/api/types";

/** 200 RoleDto[] · 401 (global: sign out) · 403 not an admin. */
export const getRoles = () => api<RoleDto[]>("/api/roles");
export const rolesQueryKey = ["roles"] as const;

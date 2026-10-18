// Identity API — AuthController (backend/Body4uHUB.Identity.Api/Controllers/AuthController.cs).
import { api } from "@/api/client";
import type { AuthResponseDto } from "@/api/types";

export interface LoginRequest {
  email: string;
  password: string;
}

/** 200 AuthResponseDto · 400 validation · 401 bad credentials · 403 email not confirmed · 429 (5/min per IP). */
export const login = (body: LoginRequest) => api<AuthResponseDto>("/api/auth/login", { method: "POST", body, auth: false });

/** 204 always (even for unknown emails) · 400 validation · 429 (3 per 15 min per IP). */
export const resendConfirmation = (email: string) =>
  api("/api/auth/resend-confirmation", { method: "POST", body: { email }, auth: false });

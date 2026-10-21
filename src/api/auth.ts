// Identity API — AuthController (backend/Body4uHUB.Identity.Api/Controllers/AuthController.cs).
import { api } from "@/api/client";
import type { AuthResponseDto, UserDto } from "@/api/types";

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
}

/** 201 UserDto (confirmation email sent) · 400 validation · 409 email exists · 429 (5 per hour per IP). */
export const register = (body: RegisterRequest) => api<UserDto>("/api/auth/register", { method: "POST", body, auth: false });

export interface LoginRequest {
  email: string;
  password: string;
}

/** 200 AuthResponseDto · 400 validation · 401 bad credentials · 403 email not confirmed · 429 (5/min per IP). */
export const login = (body: LoginRequest) => api<AuthResponseDto>("/api/auth/login", { method: "POST", body, auth: false });

/** 204 (also when already confirmed with the same token) · 400 missing email/token · 422 invalid, expired or unknown email. */
export const confirmEmail = (email: string, token: string) =>
  api("/api/auth/confirm-email", { method: "POST", body: { email, token }, auth: false });

/** 204 always (even for unknown emails) · 400 validation · 429 (3 per 15 min per IP). */
export const resendConfirmation = (email: string) =>
  api("/api/auth/resend-confirmation", { method: "POST", body: { email }, auth: false });

/** 204 always (even for unknown emails) · 400 validation · 429 (3 per 15 min per IP). Link valid 1 hour, single use. */
export const forgotPassword = (email: string) => api("/api/auth/forgot-password", { method: "POST", body: { email }, auth: false });

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

/** 204 · 400 validation · 422 link invalid, expired, already used or unknown email · 429 (5 per 15 min per IP). */
export const resetPassword = (body: ResetPasswordRequest) => api("/api/auth/reset-password", { method: "POST", body, auth: false });

// Identity validation — mirrors the API rules. Messages are i18n keys (see locales/bg.json).
import { z } from "zod";

// Backend PasswordRegex: ^(?=.{8,}$)(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_])(?!.*\s).*$
// Upper/lower are Latin-only there, so they are Latin-only here too (Cyrillic letters would pass here but fail with 400).
export const PASSWORD_RULES = [
  { id: "length", key: "pw.rule.length", test: (v: string) => v.length >= 8 },
  { id: "upper", key: "pw.rule.upper", test: (v: string) => /[A-Z]/.test(v) },
  { id: "lower", key: "pw.rule.lower", test: (v: string) => /[a-z]/.test(v) },
  { id: "digit", key: "pw.rule.digit", test: (v: string) => /\d/.test(v) },
  { id: "special", key: "pw.rule.special", test: (v: string) => /[^\p{L}\d\s]/u.test(v) },
  { id: "nospace", key: "pw.rule.nospace", test: (v: string) => v.length > 0 && !/\s/.test(v) },
] as const;

export const PHONE_RE = /^(\+3598[7-9]\d{7}|08[7-9]\d{7})$/;

export const email = z.string().trim().min(1, "v.email.required").email("v.email.format").min(6, "v.email.length").max(200, "v.email.length");
export const password = z.string().min(1, "v.password.required").refine((v) => PASSWORD_RULES.every((r) => r.test(v)), "v.password.rules");
const name = (field: "firstName" | "lastName") =>
  z.string().trim().min(1, `v.${field}.required`).min(2, `v.${field}.length`).max(20, `v.${field}.length`);
// Spaces are stripped; empty → null (the API stores no phone).
export const phoneNumber = z
  .string()
  .transform((v) => v.replace(/\s/g, ""))
  .refine((v) => v === "" || PHONE_RE.test(v), "v.phoneNumber.format")
  .transform((v) => v || null);

export const registerSchema = z.object({ firstName: name("firstName"), lastName: name("lastName"), email, phoneNumber, password });
export const loginSchema = z.object({ email, password: z.string().min(1, "v.password.required") });
export const profileSchema = z.object({ firstName: name("firstName"), lastName: name("lastName"), phoneNumber });
export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1, "v.currentPassword.required"), newPassword: password })
  .refine((v) => v.newPassword !== v.currentPassword, { message: "pw.err.same", path: ["newPassword"] });

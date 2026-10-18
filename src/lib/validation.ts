// Identity validation — mirrors the API rules. Messages are i18n keys (see locales/bg.json).
import { z } from "zod";

export const PASSWORD_RULES = [
  { id: "length", key: "pw.rule.length", test: (v: string) => v.length >= 8 },
  { id: "upper", key: "pw.rule.upper", test: (v: string) => /\p{Lu}/u.test(v) },
  { id: "lower", key: "pw.rule.lower", test: (v: string) => /\p{Ll}/u.test(v) },
  { id: "digit", key: "pw.rule.digit", test: (v: string) => /\d/.test(v) },
  { id: "special", key: "pw.rule.special", test: (v: string) => /[^\p{L}\d\s]/u.test(v) },
  { id: "nospace", key: "pw.rule.nospace", test: (v: string) => v.length > 0 && !/\s/.test(v) },
] as const;

export const PHONE_RE = /^(\+3598[7-9]\d{7}|08[7-9]\d{7})$/;

export const email = z.string().trim().min(1, "v.email.required").email("v.email.format").min(6, "v.email.length").max(200, "v.email.length");
export const password = z.string().refine((v) => PASSWORD_RULES.every((r) => r.test(v)), "v.password.rules");
export const name = z.string().trim().min(2, "v.name.length").max(20, "v.name.length");
export const phone = z.string().transform((v) => v.replace(/\s/g, "")).refine((v) => v === "" || PHONE_RE.test(v), "v.phone.format").optional();

export const registerSchema = z.object({ firstName: name, lastName: name, email, phone, password });
export const loginSchema = z.object({ email, password: z.string().min(1, "v.password.required") });
export const profileSchema = z.object({ firstName: name, lastName: name, phone });
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1, "v.password.required"), newPassword: password });

import { describe, expect, it } from "vitest";
import { changePasswordSchema, profileSchema, registerSchema } from "@/lib/validation";

const issues = (r: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) =>
  // First issue per field, like the form (zodResolver) shows it.
  Object.fromEntries((r.error?.issues ?? []).toReversed().map((i) => [i.path.join("."), i.message]));

const valid = { firstName: "Анна", lastName: "Колева", email: "anna@body4u.bg", phoneNumber: "", password: "Parola1!" };

describe("registerSchema", () => {
  it("accepts a valid form and turns an empty phone into null", () => {
    const r = registerSchema.safeParse(valid);
    expect(r.success).toBe(true);
    expect(r.data?.phoneNumber).toBeNull();
  });

  it("strips spaces from the phone and checks the Bulgarian mobile format", () => {
    expect(registerSchema.safeParse({ ...valid, phoneNumber: "0888 123 456" }).data?.phoneNumber).toBe("0888123456");
    expect(registerSchema.safeParse({ ...valid, phoneNumber: "+359888123456" }).success).toBe(true);
    expect(issues(registerSchema.safeParse({ ...valid, phoneNumber: "0288123456" }))).toEqual({ phoneNumber: "v.phoneNumber.format" });
  });

  it.each([
    ["short", "Pa1!"],
    ["no uppercase", "parola1!"],
    ["no digit", "Parola!!"],
    ["no special character", "Parola11"],
    ["a space", "Parola 1!"],
    // Backend upper/lower checks are Latin-only.
    ["Cyrillic letters only", "парола1!"],
  ])("rejects a password with %s", (_, password) => {
    expect(issues(registerSchema.safeParse({ ...valid, password }))).toEqual({ password: "v.password.rules" });
  });

  it("checks name length after trimming", () => {
    expect(issues(registerSchema.safeParse({ ...valid, firstName: " А " }))).toEqual({ firstName: "v.firstName.length" });
    expect(issues(registerSchema.safeParse({ ...valid, lastName: "" }))).toEqual({ lastName: "v.lastName.required" });
  });

  it("checks the email format and the 6–200 length", () => {
    expect(issues(registerSchema.safeParse({ ...valid, email: "anna" }))).toEqual({ email: "v.email.format" });
    // A valid-format email is at least 6 chars (x@y.zz), so in practice the length rule catches > 200.
    expect(issues(registerSchema.safeParse({ ...valid, email: `${"a".repeat(195)}@b4u.bg` }))).toEqual({ email: "v.email.length" });
  });
});

describe("profileSchema", () => {
  it("keeps the phone optional", () => {
    expect(profileSchema.safeParse({ firstName: "Анна", lastName: "Колева", phoneNumber: "" }).data?.phoneNumber).toBeNull();
  });
});

describe("changePasswordSchema", () => {
  it("requires the current password", () => {
    expect(issues(changePasswordSchema.safeParse({ currentPassword: "", newPassword: "Parola1!" }))).toEqual({
      currentPassword: "v.currentPassword.required",
    });
  });

  it("rejects a new password equal to the current one", () => {
    expect(issues(changePasswordSchema.safeParse({ currentPassword: "Parola1!", newPassword: "Parola1!" }))).toEqual({
      newPassword: "pw.err.same",
    });
  });
});

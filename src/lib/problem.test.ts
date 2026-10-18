import { describe, expect, it } from "vitest";
import bg from "@/locales/bg.json";
import { mapProblem } from "@/lib/problem";

describe("mapProblem", () => {
  it("maps 400 field errors (PascalCase) to camelCase fields with server keys", () => {
    expect(mapProblem({ status: 400, errors: [{ field: "PhoneNumber", error: "Invalid phone number format" }] }, "profile")).toEqual({
      kind: "fields",
      fields: { phoneNumber: "v.phoneNumber.server" },
    });
  });

  it("uses the credentials banner for 401 on login and a redirect elsewhere", () => {
    expect(mapProblem({ status: 401 }, "login")).toEqual({ kind: "banner", tone: "error", textKey: "login.err.401" });
    expect(mapProblem({ status: 401 }, "profile")).toEqual({ kind: "redirect", to: "/login" });
  });

  it("maps 409 to the email field on register and to the trainer warning elsewhere", () => {
    expect(mapProblem({ status: 409 }, "register")).toEqual({ kind: "fields", fields: { email: "register.err.409" } });
    expect(mapProblem({ status: 409 }, "admin.user")).toMatchObject({ tone: "warning", titleKey: "user.madeTrainer" });
  });

  it("treats a network failure and an unknown status as the generic error", () => {
    expect(mapProblem({ status: 0 }, "login")).toMatchObject({ kind: "banner", textKey: "err.network" });
    expect(mapProblem({ status: 503 }, "login")).toMatchObject({ kind: "banner", textKey: "err.500" });
  });

  it("never returns raw English API text", () => {
    const ui = mapProblem({ status: 422, detail: "User is not in the role." }, "admin.user");
    expect(JSON.stringify(ui)).not.toContain("role.");
  });

  // Every key a banner can point to must exist in bg.json, or the UI shows the raw key.
  it.each([
    [400, "register"], [401, "login"], [403, "login"], [403, "profile"], [409, "admin.user"], [422, "admin.user"],
    [429, "login"], [429, "register"], [429, "resend"], [429, "password"], [500, "login"], [0, "login"],
  ])("has Bulgarian copy for %i in %s", (status, ctx) => {
    const ui = mapProblem({ status }, ctx);
    const keys = ui.kind === "banner" ? [ui.titleKey, ui.textKey] : ui.kind === "fields" ? Object.values(ui.fields) : [];
    for (const key of keys.filter(Boolean)) expect(bg, `missing ${key}`).toHaveProperty([key as string]);
  });
});

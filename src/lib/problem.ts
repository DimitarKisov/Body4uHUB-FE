// RFC 7807 ProblemDetails → Bulgarian UI copy. Never render the raw English `detail`.
export interface ProblemDetails {
  status: number;
  title?: string;
  detail?: string;
  errors?: { field: string; error: string }[];
}
export type UiProblem =
  | { kind: "fields"; fields: Record<string, string> }        // 400 → under each field
  | { kind: "redirect"; to: "/login" }                       // 401 → login (session expired / bad token)
  | { kind: "banner"; tone: "error" | "warning"; titleKey?: string; textKey: string; retryAfter?: number };

/** ctx: "register" | "login" | "resend" | "profile" | "password" | "admin.user" */
export function mapProblem(p: ProblemDetails, ctx: string): UiProblem {
  switch (p.status) {
    case 400:
      return { kind: "fields", fields: Object.fromEntries((p.errors ?? []).map((e) => [camel(e.field), `v.${camel(e.field)}.server`])) };
    case 401:
      return ctx === "login" ? { kind: "banner", tone: "error", textKey: "login.err.401" } : { kind: "redirect", to: "/login" };
    case 403:
      return ctx === "login"
        ? { kind: "banner", tone: "warning", titleKey: "login.err.403.t", textKey: "login.err.403" }
        : { kind: "banner", tone: "warning", titleKey: "err.403.t", textKey: "err.403" };
    case 409:
      return ctx === "register"
        ? { kind: "fields", fields: { email: "register.err.409" } }
        : { kind: "banner", tone: "warning", titleKey: "user.madeTrainer", textKey: "user.err.409" };
    case 422:
      return { kind: "banner", tone: "error", titleKey: "err.422.t", textKey: "err.422" };
    case 429:
      return { kind: "banner", tone: "error", titleKey: `${ctx}.err.429.t`, textKey: `${ctx}.err.429`, retryAfter: ctx === "login" ? 60 : undefined };
    default:
      return { kind: "banner", tone: "error", titleKey: "err.500.t", textKey: "err.500" };
  }
}
const camel = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

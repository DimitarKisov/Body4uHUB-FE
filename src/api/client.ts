// fetch wrapper: adds the bearer token, throws ProblemDetails on non-2xx, and reports a dead session from authenticated calls:
// 401 → expired, 404 on /api/users/me* → account gone.
import type { ProblemDetails } from "@/lib/problem";

const BASE = import.meta.env.VITE_API_BASE ?? "";

let getToken: () => string | null = () => null;
let onUnauthorized: () => void = () => {};
let onAccountGone: () => void = () => {};

export function configureApi(opts: { getToken: () => string | null; onUnauthorized: () => void; onAccountGone: () => void }) {
  getToken = opts.getToken;
  onUnauthorized = opts.onUnauthorized;
  onAccountGone = opts.onAccountGone;
}

export class ApiError extends Error {
  readonly problem: ProblemDetails;
  constructor(problem: ProblemDetails) {
    super(problem.title ?? `HTTP ${problem.status}`);
    this.problem = problem;
  }
}

/** status 0 = network failure (no response). */
export const NETWORK_ERROR = 0;

/**
 * auth: true = send the token (default) · false = never · "optional" = public endpoint that shows more to a signed-in user:
 * the token is sent, but a 401 (expired session) is retried without it and does not end the session —
 * reading stays possible; the session dialog comes with the first action that needs sign-in.
 */
type Options = Omit<RequestInit, "body"> & { body?: unknown; auth?: boolean | "optional" };

export async function api<T = void>(path: string, { auth = true, ...opts }: Options = {}): Promise<T> {
  const token = auth ? getToken() : null;
  if (auth !== "optional" || !token) return send<T>(path, opts, token, true);
  try {
    return await send<T>(path, opts, token, false);
  } catch (e) {
    if (e instanceof ApiError && e.problem.status === 401) return send<T>(path, opts, null, false);
    throw e;
  }
}

/** One request. reportSession: a 401 / account-gone 404 on a call that carried the token ends the session. */
async function send<T>(path: string, { body, headers, ...init }: Omit<Options, "auth">, token: string | null, reportSession: boolean): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(body !== undefined && { "Content-Type": "application/json" }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError({ status: NETWORK_ERROR });
  }

  if (res.ok) {
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  if (reportSession && res.status === 401 && token) onUnauthorized();
  // The /me endpoints answer 404 when the signed-in account no longer exists (the token is still valid).
  if (reportSession && res.status === 404 && token && /^\/api\/users\/me(\/|$)/.test(path)) onAccountGone();

  let problem: ProblemDetails = { status: res.status };
  try {
    const data = await res.json();
    if (data && typeof data === "object") problem = { ...data, status: res.status };
  } catch {
    // 429 from the rate limiter and some 404s have no ProblemDetails body.
  }
  throw new ApiError(problem);
}

// fetch wrapper: adds the bearer token, throws ProblemDetails on non-2xx, and handles the session:
// a 401 on a call that carried the token → one silent refresh (refresh cookie) and the call again;
// refresh refused → expired. 404 on /api/users/me* → account gone.
import type { ProblemDetails } from "@/lib/problem";

const BASE = import.meta.env.VITE_API_BASE ?? "";

interface ApiHooks {
  getToken: () => string | null;
  /** New access token from the refresh cookie, or null when the session is over. Throws on network / server errors. */
  refresh: () => Promise<string | null>;
  /** The refresh was refused after a 401 on a call that needs sign-in → the session dialog. */
  onUnauthorized: () => void;
  /** Same, but on a public read (auth "optional"): the session is over without interrupting the page. */
  onSessionLost: () => void;
  onAccountGone: () => void;
}

let hooks: ApiHooks = {
  getToken: () => null,
  refresh: async () => null,
  onUnauthorized: () => {},
  onSessionLost: () => {},
  onAccountGone: () => {},
};

export function configureApi(opts: Partial<ApiHooks> & Pick<ApiHooks, "getToken">) {
  hooks = { ...hooks, ...opts };
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
 * the token is sent; when the session cannot be refreshed the call is repeated anonymously and the page is not
 * interrupted — the session dialog comes with the first action that needs sign-in.
 */
type Options = Omit<RequestInit, "body"> & { body?: unknown; auth?: boolean | "optional" };

export async function api<T = void>(path: string, { auth = true, ...opts }: Options = {}): Promise<T> {
  const token = auth ? hooks.getToken() : null;
  if (!token) return send<T>(path, opts, null);
  try {
    return await send<T>(path, opts, token);
  } catch (e) {
    if (!(e instanceof ApiError) || e.problem.status !== 401) throw e;
  }

  // 401 with a token: the access token ran out (or was cut short) → refresh once and repeat the call.
  const fresh = await hooks.refresh();
  if (fresh) return send<T>(path, opts, fresh, auth === true);
  if (auth === "optional") {
    hooks.onSessionLost();
    return send<T>(path, opts, null);
  }
  hooks.onUnauthorized();
  throw new ApiError({ status: 401 });
}

/** One request. endsSession: a 401 even with a just-refreshed token ends the session. */
async function send<T>(path: string, { body, headers, ...init }: Omit<Options, "auth">, token: string | null, endsSession = false): Promise<T> {
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

  if (endsSession && res.status === 401) hooks.onUnauthorized();
  // The /me endpoints answer 404 when the signed-in account no longer exists (the token is still valid).
  if (token && res.status === 404 && /^\/api\/users\/me(\/|$)/.test(path)) hooks.onAccountGone();

  let problem: ProblemDetails = { status: res.status };
  try {
    const data = await res.json();
    if (data && typeof data === "object") problem = { ...data, status: res.status };
  } catch {
    // 429 from the rate limiter and some 404s have no ProblemDetails body.
  }
  throw new ApiError(problem);
}

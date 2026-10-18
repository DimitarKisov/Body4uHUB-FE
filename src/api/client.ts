// fetch wrapper: adds the bearer token, throws ProblemDetails on non-2xx, and signs out on 401 from authenticated calls.
import type { ProblemDetails } from "@/lib/problem";

const BASE = import.meta.env.VITE_API_BASE ?? "";

let getToken: () => string | null = () => null;
let onUnauthorized: () => void = () => {};

export function configureApi(opts: { getToken: () => string | null; onUnauthorized: () => void }) {
  getToken = opts.getToken;
  onUnauthorized = opts.onUnauthorized;
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

type Options = Omit<RequestInit, "body"> & { body?: unknown; auth?: boolean };

export async function api<T = void>(path: string, { body, auth = true, headers, ...init }: Options = {}): Promise<T> {
  const token = auth ? getToken() : null;
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

  if (res.status === 401 && token) onUnauthorized();

  let problem: ProblemDetails = { status: res.status };
  try {
    const data = await res.json();
    if (data && typeof data === "object") problem = { ...data, status: res.status };
  } catch {
    // 429 from the rate limiter and some 404s have no ProblemDetails body.
  }
  throw new ApiError(problem);
}

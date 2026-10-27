// Session = { accessToken, user, sessionExpiresAt } from POST /api/auth/login or /refresh. This tab keeps it in memory +
// sessionStorage; the refresh token is an HttpOnly cookie the page never sees. The JWT lives 15 min and is renewed
// silently: 1 min before `exp`, when the tab comes back into view, and on a 401 (api client).
// A new tab or a reopened browser ("Запомни ме") restores the session with one refresh before rendering.
// The session ends for good 30 days after sign-in (`sessionExpiresAt`): warning 5 min before. A refused refresh →
// "expired"; 404 on /api/users/me → "deleted". An ended session stays in memory, so the page stays behind the dialog.
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { logout, refreshSession } from "@/api/auth";
import { ApiError, configureApi } from "@/api/client";
import type { AuthResponseDto, UserDto } from "@/api/types";
import { tokenExpiry } from "@/auth/jwt";
import { parseUtc } from "@/lib/format";

const STORAGE_KEY = "b4u.session";
/** localStorage: a refresh cookie may exist, so a tab without a session tries one refresh on start. */
const HINT_KEY = "b4u.signedIn";
const SESSION_WARNING_MS = 5 * 60 * 1000;
const REFRESH_AHEAD_MS = 60 * 1000;
/** Back in the tab after this long → refresh, so new roles (or a revoked session) show up soon. */
const FOCUS_REFRESH_AFTER_MS = 60 * 1000;

export type SessionState = "active" | "warning" | "expired" | "deleted";
/** "request": a call that needs sign-in was refused · "background": a silent refresh or the 30-day end. */
export type SessionEndedBy = "request" | "background";

interface AuthState {
  accessToken: string | null;
  user: UserDto | null;
  isAuthenticated: boolean;
  /** When the session ends at the latest (30 days after sign-in), in ms, or null. */
  sessionEndsAt: number | null;
  sessionState: SessionState;
  /** Why the session ended (null while active). Public pages show the dialog only for "request". */
  endedBy: SessionEndedBy | null;
  hasRole: (role: string) => boolean;
  signIn: (session: AuthResponseDto) => void;
  signOut: () => void;
  setUser: (user: UserDto) => void;
  dismissWarning: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

// Storage can throw (private mode, blocked site data): the session then still works in memory.
const read = (store: Storage, key: string) => {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
};
const write = (store: Storage, key: string, value: string | null) => {
  try {
    if (value === null) store.removeItem(key);
    else store.setItem(key, value);
  } catch {
    // ignore
  }
};

function loadSession(): AuthResponseDto | null {
  try {
    const raw = read(sessionStorage, STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AuthResponseDto;
    const exp = tokenExpiry(s.accessToken);
    return exp && exp > Date.now() ? s : null;
  } catch {
    return null;
  }
}

// setTimeout fires at once for delays over 2^31-1 ms (~24.8 days), and the session end is up to 30 days away.
const MAX_DELAY_MS = 2 ** 31 - 1;

/** Runs `fn` at the time `at` (ms), however far away; returns a cancel function. */
function runAt(at: number, fn: () => void): () => void {
  let id = 0;
  const schedule = () => {
    const delay = at - Date.now();
    id = window.setTimeout(delay > MAX_DELAY_MS ? schedule : fn, Math.max(0, Math.min(delay, MAX_DELAY_MS)));
  };
  schedule();
  return () => window.clearTimeout(id);
}

/** One refresh at a time across tabs: the cookie rotates, so a second parallel call would look like a stolen token. */
function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== "undefined" ? navigator.locks : undefined;
  return locks ? locks.request("b4u.refresh", fn) : fn();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthResponseDto | null>(loadSession);
  const [restoring, setRestoring] = useState(() => !session && read(localStorage, HINT_KEY) === "1");
  const [sessionState, setSessionState] = useState<SessionState>("active");
  const [endedBy, setEndedBy] = useState<SessionEndedBy | null>(null);
  const queryClient = useQueryClient();
  const tokenRef = useRef(session?.accessToken ?? null);
  const lastRefreshRef = useRef(0);
  const inflightRef = useRef<Promise<string | null> | null>(null);
  const tokenExp = session ? tokenExpiry(session.accessToken) : null;
  const sessionEndsAt = session?.sessionExpiresAt ? parseUtc(session.sessionExpiresAt).getTime() : null;

  const store = useCallback((s: AuthResponseDto) => {
    write(sessionStorage, STORAGE_KEY, JSON.stringify(s));
    write(localStorage, HINT_KEY, "1");
    tokenRef.current = s.accessToken;
    lastRefreshRef.current = Date.now();
    setSession(s);
    setSessionState("active");
    setEndedBy(null);
  }, []);

  const forget = useCallback(() => {
    write(sessionStorage, STORAGE_KEY, null);
    write(localStorage, HINT_KEY, null);
  }, []);

  const signOut = useCallback(() => {
    // Revokes the refresh cookie; signing out locally does not wait for it.
    void logout().catch(() => {});
    forget();
    tokenRef.current = null;
    setSession(null);
    setSessionState("active");
    setEndedBy(null);
    // Cached server data belongs to the previous user (e.g. users/me) → drop it.
    queryClient.clear();
  }, [forget, queryClient]);

  const setUser = useCallback((user: UserDto) => {
    setSession((s) => {
      if (!s) return s;
      const next = { ...s, user };
      write(sessionStorage, STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // A reload after this starts signed out; "deleted" wins over a later "expired" (e.g. a 401 from a query still in flight).
  // A request wins over the background, so public pages can still show the dialog once an action hits the 401.
  const endSession = useCallback(
    (kind: "expired" | "deleted", by: SessionEndedBy = "request") => {
      forget();
      setSessionState((s) => (s === "deleted" ? s : kind));
      setEndedBy((b) => (b === "request" ? b : by));
    },
    [forget],
  );

  /** New access token, or null when the server refused the session. Network / server errors throw. */
  const refresh = useCallback(() => {
    inflightRef.current ??= withRefreshLock(async () => {
      try {
        const s = await refreshSession();
        store(s);
        return s.accessToken;
      } catch (e) {
        if (e instanceof ApiError && e.problem.status === 401) {
          forget();
          return null;
        }
        throw e;
      }
    }).finally(() => {
      inflightRef.current = null;
    });
    return inflightRef.current;
  }, [forget, store]);

  const refreshInBackground = useCallback(() => {
    refresh()
      .then((token) => {
        if (!token) endSession("expired", "background");
      })
      // Offline or a server error: keep the session; the next focus or 401 tries again.
      .catch(() => {});
  }, [refresh, endSession]);

  const getToken = useCallback(() => tokenRef.current, []);

  // A layout effect, not a plain one: the children's queries start in their (passive) effects, which run after every
  // layout effect but before the parent's passive ones, so the first request after a page load carries the token.
  useLayoutEffect(() => {
    configureApi({
      getToken,
      refresh,
      onUnauthorized: () => endSession("expired", "request"),
      onSessionLost: () => endSession("expired", "background"),
      onAccountGone: () => endSession("deleted"),
    });
  }, [getToken, refresh, endSession]);

  // New tab / reopened browser: one refresh decides between signed in and signed out before anything renders.
  useEffect(() => {
    if (!restoring) return;
    refresh()
      .catch(() => null)
      .finally(() => setRestoring(false));
  }, [restoring, refresh]);

  // Renew the access token shortly before it runs out.
  useEffect(() => {
    if (!tokenExp || sessionState === "expired" || sessionState === "deleted") return;
    const id = window.setTimeout(refreshInBackground, Math.max(0, tokenExp - REFRESH_AHEAD_MS - Date.now()));
    return () => window.clearTimeout(id);
  }, [tokenExp, sessionState, refreshInBackground]);

  // Back in the tab: pick up role changes or a session revoked elsewhere without waiting for the token to run out.
  useEffect(() => {
    if (!session || sessionState === "expired" || sessionState === "deleted") return;
    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - lastRefreshRef.current > FOCUS_REFRESH_AFTER_MS) refreshInBackground();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [session, sessionState, refreshInBackground]);

  // The 30-day end cannot be extended: warn 5 min before, then end.
  useEffect(() => {
    if (!sessionEndsAt) return;
    const cancelWarn = runAt(sessionEndsAt - SESSION_WARNING_MS, () => setSessionState((s) => (s === "active" ? "warning" : s)));
    const cancelEnd = runAt(sessionEndsAt, () => endSession("expired", "background"));
    return () => {
      cancelWarn();
      cancelEnd();
    };
  }, [sessionEndsAt, endSession]);

  const dismissWarning = useCallback(() => setSessionState((s) => (s === "warning" ? "active" : s)), []);

  const value = useMemo<AuthState>(
    () => ({
      accessToken: session?.accessToken ?? null,
      user: session?.user ?? null,
      isAuthenticated: !!session,
      sessionEndsAt,
      sessionState,
      endedBy,
      hasRole: (role) => !!session?.user.roles.some((r) => r.name === role),
      signIn: store,
      signOut,
      setUser,
      dismissWarning,
    }),
    [session, sessionEndsAt, sessionState, endedBy, store, signOut, setUser, dismissWarning],
  );

  if (restoring) return null;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

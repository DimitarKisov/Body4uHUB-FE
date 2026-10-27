// Session = { accessToken, user } from POST /api/auth/login. Kept in memory + sessionStorage.
// JWT lives 60 min and there is no refresh token (design 2026-10-21 → "12 · Сесията"):
// warning 5 min before `exp`; at `exp` or on any 401 → "expired"; 404 on /api/users/me → "deleted".
// An ended session stays in memory, so the page stays behind <SessionDialog> until the user signs in again.
import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { configureApi } from "@/api/client";
import type { AuthResponseDto, UserDto } from "@/api/types";
import { tokenExpiry } from "@/auth/jwt";

const STORAGE_KEY = "b4u.session";
const SESSION_WARNING_MS = 5 * 60 * 1000;

export type SessionState = "active" | "warning" | "expired" | "deleted";

interface AuthState {
  accessToken: string | null;
  user: UserDto | null;
  isAuthenticated: boolean;
  /** `exp` of the access token in ms, or null. */
  expiresAt: number | null;
  sessionState: SessionState;
  /** Why the session ended: a request answered 401 / account gone, or the token's `exp` passed (null while active). */
  endedBy: "request" | "timer" | null;
  hasRole: (role: string) => boolean;
  signIn: (session: AuthResponseDto) => void;
  signOut: () => void;
  setUser: (user: UserDto) => void;
  dismissWarning: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function loadSession(): AuthResponseDto | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AuthResponseDto;
    const exp = tokenExpiry(s.accessToken);
    return exp && exp > Date.now() ? s : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthResponseDto | null>(loadSession);
  const [sessionState, setSessionState] = useState<SessionState>("active");
  const [endedBy, setEndedBy] = useState<"request" | "timer" | null>(null);
  const queryClient = useQueryClient();
  const expiresAt = session ? tokenExpiry(session.accessToken) : null;

  const signOut = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setSessionState("active");
    setEndedBy(null);
    // Cached server data belongs to the previous user (e.g. users/me) → drop it.
    queryClient.clear();
  }, [queryClient]);

  const signIn = useCallback((s: AuthResponseDto) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    setSession(s);
    setSessionState("active");
    setEndedBy(null);
  }, []);

  const setUser = useCallback((user: UserDto) => {
    setSession((s) => {
      if (!s) return s;
      const next = { ...s, user };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // A reload after this starts signed out; "deleted" wins over a later "expired" (e.g. a 401 from a query still in flight).
  // A request wins over the timer, so public pages can still show the dialog once an action hits the 401.
  const endSession = useCallback((kind: "expired" | "deleted", by: "request" | "timer" = "request") => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSessionState((s) => (s === "deleted" ? s : kind));
    setEndedBy((b) => (b === "request" ? b : by));
  }, []);

  const dismissWarning = useCallback(() => setSessionState((s) => (s === "warning" ? "active" : s)), []);

  // Token getter reads the latest session. 401 / missing account → the dialog, not a redirect.
  // Wired during render, not in an effect: the children's queries start in their own effects, which run before the
  // parent's, so the first request after a page load would otherwise go out without the token. Only swaps callbacks.
  configureApi({
    getToken: () => session?.accessToken ?? null,
    onUnauthorized: () => endSession("expired"),
    onAccountGone: () => endSession("deleted"),
  });

  useEffect(() => {
    if (!expiresAt) return;
    const now = Date.now();
    const warn = window.setTimeout(
      () => setSessionState((s) => (s === "active" ? "warning" : s)),
      Math.max(0, expiresAt - SESSION_WARNING_MS - now),
    );
    const expire = window.setTimeout(() => endSession("expired", "timer"), Math.max(0, expiresAt - now));
    return () => {
      window.clearTimeout(warn);
      window.clearTimeout(expire);
    };
  }, [expiresAt, endSession]);

  const value = useMemo<AuthState>(
    () => ({
      accessToken: session?.accessToken ?? null,
      user: session?.user ?? null,
      isAuthenticated: !!session,
      expiresAt,
      sessionState,
      endedBy,
      hasRole: (role) => !!session?.user.roles.some((r) => r.name === role),
      signIn,
      signOut,
      setUser,
      dismissWarning,
    }),
    [session, expiresAt, sessionState, endedBy, signIn, signOut, setUser, dismissWarning],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// Session = { accessToken, user } from POST /api/auth/login. Kept in memory + sessionStorage.
// JWT lives 60 min and there is no refresh token, so we sign out when `exp` passes.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { configureApi } from "@/api/client";
import type { AuthResponseDto, UserDto } from "@/api/types";
import { tokenExpiry } from "@/auth/jwt";

const STORAGE_KEY = "b4u.session";

interface AuthState {
  accessToken: string | null;
  user: UserDto | null;
  isAuthenticated: boolean;
  hasRole: (role: string) => boolean;
  signIn: (session: AuthResponseDto) => void;
  signOut: () => void;
  setUser: (user: UserDto) => void;
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

  const signOut = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const signIn = useCallback((s: AuthResponseDto) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    setSession(s);
  }, []);

  const setUser = useCallback((user: UserDto) => {
    setSession((s) => {
      if (!s) return s;
      const next = { ...s, user };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  // Token getter reads the latest session; 401 on an authenticated call → sign out (guards redirect to /login).
  useEffect(() => {
    configureApi({ getToken: () => session?.accessToken ?? null, onUnauthorized: signOut });
  }, [session, signOut]);

  // Auto sign-out at JWT expiry. TODO: "Сесията изтече" state (reserved, not designed yet).
  useEffect(() => {
    if (!session) return;
    const exp = tokenExpiry(session.accessToken);
    if (!exp) return;
    const id = window.setTimeout(signOut, Math.max(0, exp - Date.now()));
    return () => window.clearTimeout(id);
  }, [session, signOut]);

  const value = useMemo<AuthState>(
    () => ({
      accessToken: session?.accessToken ?? null,
      user: session?.user ?? null,
      isAuthenticated: !!session,
      hasRole: (role) => !!session?.user.roles.some((r) => r.name === role),
      signIn,
      signOut,
      setUser,
    }),
    [session, signIn, signOut, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

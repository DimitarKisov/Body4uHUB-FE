import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

export function RequireRole({ role }: { role: string }) {
  const { hasRole } = useAuth();
  // TODO: render the "Нямаш достъп" EmptyState instead of redirecting once that component exists.
  if (!hasRole(role)) return <Navigate to="/profile" replace />;
  return <Outlet />;
}

/** "/" (the logo link): signed in → profile, otherwise → login. */
export function HomeRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? "/profile" : "/login"} replace />;
}

/** Public auth screens: a signed-in user goes back to the page RequireAuth sent them from, else the profile. */
export function GuestOnly() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (isAuthenticated) {
    const from = (location.state as { from?: Location } | null)?.from;
    return <Navigate to={from ? `${from.pathname}${from.search}` : "/profile"} replace />;
  }
  return <Outlet />;
}

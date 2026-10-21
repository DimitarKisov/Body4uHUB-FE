import { Navigate, Outlet, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { safeReturnTo } from "@/auth/returnTo";

export function RequireAuth() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

export function RequireRole({ role }: { role: string }) {
  const { hasRole } = useAuth();
  // TODO: render the "Нямаш достъп" EmptyState instead of redirecting once that component exists.
  // Also the fallback for a ?returnTo= the user's role no longer allows (design 2026-10-21).
  if (!hasRole(role)) return <Navigate to="/profile" replace />;
  return <Outlet />;
}

/** Public auth screens: a signed-in user goes to ?returnTo= (after "Сесията изтече"), else the page RequireAuth sent them from, else the profile. */
export function GuestOnly() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  if (isAuthenticated) {
    const from = (location.state as { from?: Location } | null)?.from;
    const to = safeReturnTo(params.get("returnTo")) ?? (from ? `${from.pathname}${from.search}` : "/profile");
    return <Navigate to={to} replace />;
  }
  return <Outlet />;
}

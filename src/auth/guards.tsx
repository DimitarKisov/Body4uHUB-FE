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

/** Public auth screens: a signed-in user goes straight to the profile. */
export function GuestOnly() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/profile" replace />;
  return <Outlet />;
}

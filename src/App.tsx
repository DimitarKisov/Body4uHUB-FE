import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { GuestOnly, HomeRedirect, RequireAuth, RequireRole } from "@/auth/guards";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { AppShell } from "@/components/layout/AppShell";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { CheckEmailPage } from "@/pages/auth/CheckEmailPage";
import { ConfirmEmailPage } from "@/pages/auth/ConfirmEmailPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { Placeholder } from "@/pages/Placeholder";

export default function App() {
  const { pathname } = useLocation();
  return (
    // resetKey: navigating to another screen clears a previous crash.
    <ErrorBoundary resetKey={pathname}>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route element={<GuestOnly />}>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/check-email" element={<CheckEmailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/resend-confirmation" element={<Placeholder auth titleKey="resend.title" />} />
          </Route>
          {/* Reachable while signed in too: the link comes from an email. */}
          <Route path="/confirm-email" element={<ConfirmEmailPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/profile" element={<Placeholder titleKey="profile.title" />} />
            <Route path="/profile/edit" element={<Placeholder titleKey="edit.title" />} />
            <Route path="/security" element={<Placeholder titleKey="pw.title" />} />
            <Route element={<RequireRole role="Administrator" />}>
              <Route path="/admin/users" element={<Placeholder titleKey="users.title" />} />
              <Route path="/admin/users/:id" element={<Placeholder titleKey="user.details" />} />
            </Route>
          </Route>
        </Route>

        <Route path="/" element={<HomeRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

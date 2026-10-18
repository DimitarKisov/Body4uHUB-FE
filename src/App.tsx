import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { GuestOnly, RequireAuth, RequireRole } from "@/auth/guards";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { AppShell } from "@/components/layout/AppShell";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { MODULES } from "@/lib/modules";
import { CheckEmailPage } from "@/pages/auth/CheckEmailPage";
import { ConfirmEmailPage } from "@/pages/auth/ConfirmEmailPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { HomePage } from "@/pages/home/HomePage";
import { Placeholder } from "@/pages/Placeholder";
import { SoonPage } from "@/pages/SoonPage";

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

        {/* Public, signed in or not. */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          {MODULES.map((m) => (
            <Route key={m.id} path={m.to} element={<SoonPage module={m} />} />
          ))}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

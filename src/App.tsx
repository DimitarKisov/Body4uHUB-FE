import { Navigate, Route, Routes } from "react-router-dom";
import { GuestOnly, RequireAuth, RequireRole } from "@/auth/guards";
import { AppShell } from "@/components/layout/AppShell";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Placeholder } from "@/pages/Placeholder";

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route element={<GuestOnly />}>
          <Route path="/register" element={<Placeholder auth titleKey="register.title" />} />
          <Route path="/register/check-email" element={<Placeholder auth titleKey="check.title" />} />
          <Route path="/login" element={<Placeholder auth titleKey="login.title" />} />
          <Route path="/resend-confirmation" element={<Placeholder auth titleKey="resend.title" />} />
        </Route>
        {/* Reachable while signed in too: the link comes from an email. */}
        <Route path="/confirm-email" element={<Placeholder auth titleKey="confirm.loading" />} />
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

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

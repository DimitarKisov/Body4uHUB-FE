import { lazy, type ComponentType } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { GuestOnly, RequireAuth, RequireRole } from "@/auth/guards";
import { ErrorBoundary } from "@/components/feedback/ErrorBoundary";
import { Toaster } from "@/components/feedback/Toaster";
import { AppShell } from "@/components/layout/AppShell";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { MODULES } from "@/lib/modules";
import { HomePage } from "@/pages/home/HomePage";
import { SoonPage } from "@/pages/SoonPage";

// Public landing pages load eagerly; everything else is a separate chunk (forms pull in zod + react-hook-form).
// Layouts wrap their <Outlet /> in <Suspense>, so the shell stays on screen while a chunk loads.
const page = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })));

const RegisterPage = page(() => import("@/pages/auth/RegisterPage"), "RegisterPage");
const CheckEmailPage = page(() => import("@/pages/auth/CheckEmailPage"), "CheckEmailPage");
const LoginPage = page(() => import("@/pages/auth/LoginPage"), "LoginPage");
const ResendConfirmationPage = page(() => import("@/pages/auth/ResendConfirmationPage"), "ResendConfirmationPage");
const ConfirmEmailPage = page(() => import("@/pages/auth/ConfirmEmailPage"), "ConfirmEmailPage");
const ForgotPasswordPage = page(() => import("@/pages/auth/ForgotPasswordPage"), "ForgotPasswordPage");
const ResetPasswordPage = page(() => import("@/pages/auth/ResetPasswordPage"), "ResetPasswordPage");
const ProfilePage = page(() => import("@/pages/account/ProfilePage"), "ProfilePage");
const EditProfilePage = page(() => import("@/pages/account/EditProfilePage"), "EditProfilePage");
const ChangePasswordPage = page(() => import("@/pages/account/ChangePasswordPage"), "ChangePasswordPage");
const UsersPage = page(() => import("@/pages/admin/UsersPage"), "UsersPage");
const UserDetailsPage = page(() => import("@/pages/admin/UserDetailsPage"), "UserDetailsPage");
const ArticlesPage = page(() => import("@/pages/content/ArticlesPage"), "ArticlesPage");
const ArticlePage = page(() => import("@/pages/content/ArticlePage"), "ArticlePage");

export default function App() {
  const { pathname } = useLocation();
  return (
    // resetKey: navigating to another screen clears a previous crash.
    <ErrorBoundary resetKey={pathname}>
      <Toaster />
      <Routes>
        <Route element={<AuthLayout />}>
          <Route element={<GuestOnly />}>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/register/check-email" element={<CheckEmailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/resend-confirmation" element={<ResendConfirmationPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
          {/* Reachable while signed in too: the links come from an email. */}
          <Route path="/confirm-email" element={<ConfirmEmailPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/edit" element={<EditProfilePage />} />
            <Route path="/security" element={<ChangePasswordPage />} />
            <Route element={<RequireRole role="Administrator" />}>
              <Route path="/admin/users" element={<UsersPage />} />
              <Route path="/admin/users/:id" element={<UserDetailsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Public, signed in or not. */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:id" element={<ArticlePage />} />
          {MODULES.filter((m) => m.soon).map((m) => (
            <Route key={m.id} path={m.to} element={<SoonPage module={m} />} />
          ))}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}

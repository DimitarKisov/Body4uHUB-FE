// Session end notices (design: ui_kits/identity/App.jsx → SessionWarning, SessionDialog; README "12 · Сесията").
// Rendered by the AppShell from AuthContext.sessionState.
import { startTransition, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Clock, UserMinus } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { Banner } from "@/components/feedback/Banner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const formatLeft = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} мин.`;
};

/** Warning banner 5 min before `exp`. Informational only: there is no refresh token, so the session can't be extended. */
export function SessionWarning() {
  const { sessionState, expiresAt, dismissWarning } = useAuth();
  if (sessionState !== "warning" || !expiresAt) return null;
  return <WarningBanner expiresAt={expiresAt} onDismiss={dismissWarning} />;
}

// Mounted only while warning, so the countdown starts from the current time.
function WarningBanner({ expiresAt, onDismiss }: { expiresAt: number; onDismiss: () => void }) {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <Banner
      tone="warning"
      icon={Clock}
      title={t("session.warn.t", { time: formatLeft(expiresAt - now) })}
      className="mb-5"
      actions={
        <Button size="sm" variant="secondary" onClick={onDismiss}>
          {t("session.warn.ok")}
        </Button>
      }
    >
      {t("session.warn")}
    </Banner>
  );
}

/**
 * "Сесията ти изтече" (at `exp` or any 401) / "Профилът не е наличен" (404 on /api/users/me). Can't be dismissed:
 * Escape and overlay clicks do nothing, focus stays on the only button. Expired → login, then back to this page.
 * `afterRequest` (public pages): only once a request failed — a token that merely ran out does not interrupt reading.
 */
export function SessionExpiredDialog({ afterRequest }: { afterRequest?: boolean }) {
  const { t } = useTranslation();
  const { sessionState, endedBy, user, signOut } = useAuth();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const ref = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const textId = useId();
  const ended = sessionState === "expired" || sessionState === "deleted";
  const kind = ended && (!afterRequest || endedBy === "request") ? sessionState : null;

  useEffect(() => {
    if (!kind) return;
    ref.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [kind]);

  if (!kind) return null;
  const expired = kind === "expired";

  function toLogin() {
    const q = new URLSearchParams({ reason: kind! });
    if (expired) {
      if (user) q.set("email", user.email);
      q.set("returnTo", pathname + search);
    }
    // The router navigates in a transition; signing out in the same one renders the login screen once,
    // instead of RequireAuth redirecting to a bare /login first.
    startTransition(() => {
      navigate(`/login?${q}`, { replace: true });
      signOut();
    });
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex animate-in items-end justify-center bg-overlay fade-in-0 sm:items-center sm:p-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={textId}
        onKeyDown={(e) => e.key === "Tab" && e.preventDefault()}
        className="w-full max-w-[440px] animate-in rounded-t-lg bg-popover p-6 shadow-lg fade-in-0 slide-in-from-bottom-2 sm:rounded-lg"
      >
        <div
          className={cn(
            "mb-4 flex size-11 items-center justify-center rounded-md [&_svg]:size-[22px]",
            expired ? "bg-muted text-foreground" : "bg-error-subtle text-error",
          )}
        >
          {expired ? <Clock /> : <UserMinus />}
        </div>
        <h2 id={titleId} className="text-xl leading-[26px] tracking-[-0.015em]">
          {t(`session.${kind}.t`)}
        </h2>
        <p id={textId} className="mt-2 text-sm text-body">
          {t(`session.${kind}`)}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end">
          <Button ref={ref} size="lg" onClick={toLogin}>
            {t(`session.${kind}.cta`)}
            {expired && <ArrowRight />}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

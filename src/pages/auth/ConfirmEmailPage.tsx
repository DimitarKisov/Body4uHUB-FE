// Screen 3 · Потвърждение на имейл — POST /api/auth/confirm-email, called on mount with ?token=&email= from the email link
// (design: ui_kits/identity/AuthScreens.jsx → ConfirmEmailScreen).
// 204 → success · 400/422 → "link invalid or expired" · network/500 → generic error with retry (not "invalid link",
// so the user isn't pushed to request a new token because of an outage).
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, BadgeCheck, CircleAlert, LoaderCircle, MailWarning, RefreshCw } from "lucide-react";
import { confirmEmail } from "@/api/auth";
import { ApiError } from "@/api/client";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/button";

type State = "loading" | "ok" | "bad" | "error";

export function ConfirmEmailPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const [state, setState] = useState<State>(token && email ? "loading" : "bad");
  const [attempt, setAttempt] = useState(0);
  // StrictMode runs effects twice in dev; share one request per attempt instead of confirming twice.
  const request = useRef<{ attempt: number; promise: Promise<void> } | null>(null);

  useEffect(() => {
    if (!token || !email) return;
    if (request.current?.attempt !== attempt) request.current = { attempt, promise: confirmEmail(email, token) };
    let live = true;
    request.current.promise.then(
      () => live && setState("ok"),
      (e) => live && setState(e instanceof ApiError && (e.problem.status === 400 || e.problem.status === 422) ? "bad" : "error"),
    );
    return () => {
      live = false;
    };
  }, [token, email, attempt]);

  const q = email ? `?email=${encodeURIComponent(email)}` : "";

  if (state === "loading") {
    return (
      <div role="status">
        <EmptyState icon={<LoaderCircle className="animate-spin" />} title={t("confirm.loading")}>
          {t("confirm.loading.text")}
        </EmptyState>
      </div>
    );
  }

  if (state === "ok") {
    return (
      <EmptyState
        icon={<BadgeCheck />}
        tone="accent"
        title={t("confirm.ok.t")}
        actions={
          <Button asChild size="lg" className="w-full">
            <Link to={`/login${q}`}>
              {t("confirm.ok.cta")}
              <ArrowRight />
            </Link>
          </Button>
        }
      >
        {t("confirm.ok")}
      </EmptyState>
    );
  }

  if (state === "error") {
    return (
      <EmptyState
        icon={<CircleAlert />}
        tone="error"
        title={t("err.500.t")}
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              setState("loading");
              setAttempt((a) => a + 1);
            }}
          >
            <RefreshCw />
            {t("common.retry")}
          </Button>
        }
      >
        {t("err.500")}
      </EmptyState>
    );
  }

  return (
    <EmptyState
      icon={<MailWarning />}
      tone="error"
      title={t("confirm.bad.t")}
      actions={
        <Button asChild size="lg" className="w-full">
          <Link to={`/resend-confirmation${q}`}>{t("confirm.bad.cta")}</Link>
        </Button>
      }
    >
      {t("confirm.bad")}
    </EmptyState>
  );
}

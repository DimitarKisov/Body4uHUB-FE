// Screen 1b · Провери пощата си — shown after a successful register (no endpoint). Email comes in router state.
import { Trans, useTranslation } from "react-i18next";
import { Link, Navigate, useLocation } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/button";

export function CheckEmailPage() {
  const { t } = useTranslation();
  const email = (useLocation().state as { email?: string } | null)?.email;
  if (!email) return <Navigate to="/register" replace />;
  const q = `?email=${encodeURIComponent(email)}`;

  return (
    <EmptyState
      icon={<MailCheck />}
      tone="accent"
      title={t("check.title")}
      actions={
        <>
          <Button asChild size="lg" className="w-full">
            <Link to={`/login${q}`}>{t("check.toLogin")}</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link to={`/resend-confirmation${q}`}>
              {t("check.resend")} {t("confirm.bad.cta")}
            </Link>
          </Button>
        </>
      }
    >
      <p>
        <Trans i18nKey="check.text" values={{ email }} components={{ b: <strong className="font-semibold [overflow-wrap:anywhere] text-foreground" /> }} />
      </p>
      <p className="mt-3 text-[13px] text-muted-foreground">{t("check.note")}</p>
    </EmptyState>
  );
}

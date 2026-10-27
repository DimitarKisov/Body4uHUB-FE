// Content feedback blocks (design: content shared.jsx → LoadError, LoginPrompt, ProblemBanner).
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { CircleAlert, Clock, LogIn, RefreshCw } from "lucide-react";
import { Banner } from "@/components/feedback/Banner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BannerCopy } from "@/lib/problem";

/** Error EmptyState in a Card, with "Опитай отново". */
export function LoadError({ title, onRetry }: { title?: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <Card padded={false}>
      <EmptyState
        icon={<CircleAlert />}
        tone="error"
        title={title ?? t("err.500.t")}
        actions={
          onRetry && (
            <Button variant="secondary" onClick={onRetry}>
              <RefreshCw />
              {t("common.retry")}
            </Button>
          )
        }
      >
        {t("err.500")}
      </EmptyState>
    </Card>
  );
}

/** "Влез, за да …" + Вход (back to this page after login) / Създай профил. */
export function LoginPrompt({ children, className }: { children: ReactNode; className?: string }) {
  const { t } = useTranslation();
  const { pathname, search } = useLocation();
  return (
    <Banner
      tone="neutral"
      icon={LogIn}
      className={className}
      actions={
        <>
          <Button asChild size="sm" variant="dark">
            <Link to={`/login?returnTo=${encodeURIComponent(pathname + search)}`}>{t("content.loginPrompt.cta")}</Link>
          </Button>
          <Button asChild size="sm" variant="secondary">
            <Link to="/register">{t("content.loginPrompt.reg")}</Link>
          </Button>
        </>
      }
    >
      {children}
    </Banner>
  );
}

/** Banner for a mapped API problem (lib/problem contentBanner). 429 gets the clock icon. */
export function ProblemBanner({ copy, status, className }: { copy: BannerCopy; status?: number; className?: string }) {
  const { t } = useTranslation();
  return (
    <Banner tone={copy.tone} icon={status === 429 ? Clock : undefined} title={copy.titleKey && t(copy.titleKey)} className={className}>
      {t(copy.textKey)}
    </Banner>
  );
}

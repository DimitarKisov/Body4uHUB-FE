// Screen 10 · Забравена парола — POST /api/auth/forgot-password (design: ui_kits/identity/AuthScreens.jsx → ForgotScreen).
// The API answers 204 for any email, so success never says whether the account exists; it replaces the form (like 1b).
// 400 → field error · 429 (3 per 15 min per IP) → banner, submit locked until reload · network/500 → banner.
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trans, useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Mail } from "lucide-react";
import { z } from "zod";
import { forgotPassword } from "@/api/auth";
import { ApiError } from "@/api/client";
import { Banner } from "@/components/feedback/Banner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { TextField } from "@/components/forms/TextField";
import { AuthHead } from "@/components/layout/AuthHead";
import { Button } from "@/components/ui/button";
import { mapProblem } from "@/lib/problem";
import { email } from "@/lib/validation";

const forgotSchema = z.object({ email });
type ForgotForm = z.infer<typeof forgotSchema>;
type BannerState = { tone: "error" | "warning"; titleKey?: string; textKey: string } | null;

const linkClass = "font-medium text-foreground underline decoration-border-strong underline-offset-[3px] hover:decoration-foreground";
const toLogin = (address: string) => (address ? `/login?email=${encodeURIComponent(address)}` : "/login");

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const [banner, setBanner] = useState<BannerState>(null);
  const [locked, setLocked] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: params.get("email") ?? "" },
  });

  async function onSubmit(values: ForgotForm) {
    setBanner(null);
    try {
      await forgotPassword(values.email);
      setSent(values.email);
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      const ui = mapProblem(e.problem, "forgot");
      if (ui.kind === "fields") {
        for (const [field, key] of Object.entries(ui.fields)) setError(field as keyof ForgotForm, { message: key });
      } else if (ui.kind === "banner") {
        setBanner(ui);
        if (e.problem.status === 429) setLocked(true);
      }
    }
  }

  const typed = useWatch({ control, name: "email" }).trim();

  if (sent) {
    return (
      <EmptyState
        icon={<Mail />}
        tone="accent"
        title={t("forgot.sent.t")}
        actions={
          <>
            <Button asChild size="lg" className="w-full">
              <Link to={toLogin(sent)}>{t("check.toLogin")}</Link>
            </Button>
            {/* Back to the form; react-hook-form keeps the email. */}
            <Button variant="ghost" className="w-full" onClick={() => setSent(null)}>
              {t("forgot.again")}
            </Button>
          </>
        }
      >
        <p>
          <Trans i18nKey="forgot.sent" values={{ email: sent }} components={{ b: <strong className="font-semibold [overflow-wrap:anywhere] text-foreground" /> }} />
        </p>
        <p className="mt-3 text-[13px] text-muted-foreground">{t("forgot.sent.note")}</p>
      </EmptyState>
    );
  }

  return (
    <>
      <AuthHead title={t("forgot.title")} lead={t("forgot.lead")} />

      {banner && (
        <Banner tone={banner.tone} title={banner.titleKey && t(banner.titleKey)} className="mb-5">
          {t(banner.textKey)}
        </Banner>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[18px]">
        <TextField
          label={t("f.email")}
          type="email"
          autoComplete="email"
          placeholder={t("f.email.ph")}
          error={errors.email?.message}
          {...register("email")}
        />
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} disabled={locked}>
          {t("forgot.submit")}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm">
        <Link to={toLogin(typed)} className={linkClass}>
          {t("check.toLogin")}
        </Link>
      </p>
    </>
  );
}

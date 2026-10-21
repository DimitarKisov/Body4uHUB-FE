// Screen 11 · Нова парола — POST /api/auth/reset-password with ?token=&email= from the email link
// (design: ui_kits/identity/AuthScreens.jsx → ResetScreen). No repeat field: show/hide + the live checklist cover typos.
// 204 → success state (not signed in) · 422 or missing token/email (no call) → invalid-link state · 400 → field error
// (on email/token = a broken link → invalid state) · 429 (5 per 15 min per IP) → banner, submit locked · network/500 → banner, values kept.
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trans, useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, BadgeCheck, KeyRound } from "lucide-react";
import { z } from "zod";
import { resetPassword } from "@/api/auth";
import { ApiError } from "@/api/client";
import { Banner } from "@/components/feedback/Banner";
import { EmptyState } from "@/components/feedback/EmptyState";
import { PasswordChecklist } from "@/components/forms/PasswordChecklist";
import { PasswordField } from "@/components/forms/PasswordField";
import { AuthHead } from "@/components/layout/AuthHead";
import { Button } from "@/components/ui/button";
import { mapProblem } from "@/lib/problem";
import { password } from "@/lib/validation";

const resetSchema = z.object({ newPassword: password });
type ResetForm = z.infer<typeof resetSchema>;
type BannerState = { tone: "error" | "warning"; titleKey?: string; textKey: string } | null;

const linkClass = "font-medium text-foreground underline decoration-border-strong underline-offset-[3px] hover:decoration-foreground";

export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const [state, setState] = useState<"form" | "done" | "invalid">(token && email ? "form" : "invalid");
  const [banner, setBanner] = useState<BannerState>(null);
  const [locked, setLocked] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<ResetForm>({ resolver: zodResolver(resetSchema), defaultValues: { newPassword: "" } });

  async function onSubmit(values: ResetForm) {
    setBanner(null);
    try {
      await resetPassword({ email, token, newPassword: values.newPassword });
      setState("done");
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      const { status } = e.problem;
      if (status === 422) return setState("invalid");
      const ui = mapProblem(e.problem, "reset");
      if (ui.kind === "fields") {
        // Only the password is on screen; a 400 on email/token means the link itself is broken.
        if (Object.keys(ui.fields).some((f) => f !== "newPassword")) return setState("invalid");
        setError("newPassword", { message: ui.fields.newPassword ?? "v.newPassword.server" }, { shouldFocus: true });
      } else if (ui.kind === "banner") {
        setBanner(ui);
        if (status === 429) setLocked(true);
      }
    }
  }

  const newPassword = useWatch({ control, name: "newPassword" });
  const q = email ? `?email=${encodeURIComponent(email)}` : "";

  if (state === "done") {
    return (
      <EmptyState
        icon={<BadgeCheck />}
        tone="accent"
        title={t("reset.ok.t")}
        actions={
          <Button asChild size="lg" className="w-full">
            <Link to={`/login?email=${encodeURIComponent(email)}&reason=reset`}>
              {t("reset.ok.cta")}
              <ArrowRight />
            </Link>
          </Button>
        }
      >
        {t("reset.ok")}
      </EmptyState>
    );
  }

  if (state === "invalid") {
    return (
      <EmptyState
        icon={<KeyRound />}
        tone="error"
        title={t("reset.bad.t")}
        actions={
          <Button asChild size="lg" className="w-full">
            <Link to={`/forgot-password${q}`}>{t("reset.bad.cta")}</Link>
          </Button>
        }
      >
        {t("reset.bad")}
      </EmptyState>
    );
  }

  return (
    <>
      <AuthHead
        title={t("reset.title")}
        lead={<Trans i18nKey="reset.lead" values={{ email }} components={{ b: <strong className="font-semibold [overflow-wrap:anywhere] text-foreground" /> }} />}
      />

      {banner && (
        <Banner tone={banner.tone} title={banner.titleKey && t(banner.titleKey)} className="mb-5">
          {t(banner.textKey)}
        </Banner>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[18px]">
        {/* Lets password managers save the new password to the right account. */}
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
        <div className="flex flex-col gap-2.5">
          <PasswordField label={t("f.newPassword")} autoComplete="new-password" error={errors.newPassword?.message} {...register("newPassword")} />
          <PasswordChecklist value={newPassword} showErrors={isSubmitted} />
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} disabled={locked}>
          {t("reset.submit")}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm">
        <Link to={`/login${q}`} className={linkClass}>
          {t("check.toLogin")}
        </Link>
      </p>
    </>
  );
}

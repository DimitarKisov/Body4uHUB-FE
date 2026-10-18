// Screen 2 · Вход — POST /api/auth/login (design: ui_kits/identity/AuthScreens.jsx → LoginScreen).
// 401 → generic credentials banner · 403 → unconfirmed warning + resend · 429 → 60s countdown · 400 → field errors.
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import type { z } from "zod";
import { login, resendConfirmation } from "@/api/auth";
import { ApiError } from "@/api/client";
import { useAuth } from "@/auth/AuthContext";
import { Banner } from "@/components/feedback/Banner";
import { PasswordField } from "@/components/forms/PasswordField";
import { TextField } from "@/components/forms/TextField";
import { AuthHead } from "@/components/layout/AuthHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mapProblem } from "@/lib/problem";
import { loginSchema } from "@/lib/validation";

type LoginForm = z.infer<typeof loginSchema>;
type BannerState = { tone: "error" | "warning"; titleKey?: string; textKey: string } | null;
type Unconfirmed = null | "idle" | "sending" | "sent";

const RATE_LIMIT_SECONDS = 60; // backend: 5 attempts per 1-minute fixed window per IP

export function LoginPage() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [params] = useSearchParams();
  const [banner, setBanner] = useState<BannerState>(null);
  const [unconfirmed, setUnconfirmed] = useState<Unconfirmed>(null);
  const [wait, setWait] = useState(0);

  const {
    register,
    handleSubmit,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: params.get("email") ?? "", password: "" },
  });

  useEffect(() => {
    if (!wait) return;
    const id = window.setTimeout(() => setWait((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [wait]);

  async function onSubmit(values: LoginForm) {
    setBanner(null);
    setUnconfirmed(null);
    try {
      // GuestOnly redirects to the original page (or /profile) once the session is set.
      signIn(await login(values));
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      const { status } = e.problem;
      if (status === 403) return setUnconfirmed("idle");
      if (status === 429) return setWait(RATE_LIMIT_SECONDS);
      const ui = mapProblem(e.problem, "login");
      if (ui.kind === "fields") {
        for (const [field, key] of Object.entries(ui.fields)) setError(field as keyof LoginForm, { message: key });
      } else if (ui.kind === "banner") {
        setBanner({ tone: ui.tone, titleKey: status === 401 ? undefined : ui.titleKey, textKey: ui.textKey });
      }
    }
  }

  async function resend() {
    setUnconfirmed("sending");
    // Neutral by design: the API answers 204 for any email, and we show the same result on errors too.
    await resendConfirmation(getValues("email").trim()).catch(() => {});
    setUnconfirmed("sent");
  }

  return (
    <>
      <AuthHead title={t("login.title")} lead={t("login.lead")} />

      {wait > 0 && (
        <Banner tone="error" title={t("login.err.429.t")} className="mb-5">
          {t("login.err.429", { s: wait })}
        </Banner>
      )}
      {banner && (
        <Banner tone={banner.tone} title={banner.titleKey && t(banner.titleKey)} className="mb-5">
          {t(banner.textKey)}
        </Banner>
      )}
      {unconfirmed === "sent" && <Banner tone="success" title={t("login.err.403.sent")} className="mb-5" />}
      {(unconfirmed === "idle" || unconfirmed === "sending") && (
        <Banner
          tone="warning"
          title={t("login.err.403.t")}
          className="mb-5"
          actions={
            <Button size="sm" variant="dark" loading={unconfirmed === "sending"} onClick={resend}>
              {t("login.err.403.cta")}
            </Button>
          }
        >
          {t("login.err.403")}
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
        <div className="flex flex-col gap-2">
          <PasswordField label={t("f.password")} error={errors.password?.message} {...register("password")} />
          {/* Reserved: becomes a link to /forgot-password later. */}
          <span title={t("common.soon")} className="inline-flex items-center gap-1.5 self-end text-[13px] text-muted-foreground">
            <span className="underline decoration-border-strong underline-offset-[3px]">{t("login.forgot")}</span>
            <Badge tone="outline" className="h-[18px] px-1.5 text-[10px]">{t("common.soon")}</Badge>
          </span>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} disabled={wait > 0}>
          {wait > 0 ? `${t("login.submit")} · ${wait} сек.` : t("login.submit")}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-body">
        {t("login.noAccount")}{" "}
        <Link to="/register" className="font-medium text-foreground underline decoration-border-strong underline-offset-[3px] hover:decoration-foreground">
          {t("login.toRegister")}
        </Link>
      </p>
    </>
  );
}

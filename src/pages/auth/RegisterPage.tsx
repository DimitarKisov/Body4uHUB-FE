// Screen 1 · Регистрация — POST /api/auth/register (design: ui_kits/identity/AuthScreens.jsx → RegisterScreen).
// 409 → error under Имейл + "Влез с този имейл" · 400 → field errors + banner · 429 → banner, submit locked · success → 1b.
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import type { z } from "zod";
import { register as registerUser } from "@/api/auth";
import { ApiError } from "@/api/client";
import { Banner } from "@/components/feedback/Banner";
import { PasswordChecklist } from "@/components/forms/PasswordChecklist";
import { PasswordField } from "@/components/forms/PasswordField";
import { TextField } from "@/components/forms/TextField";
import { AuthHead } from "@/components/layout/AuthHead";
import { Button } from "@/components/ui/button";
import { mapProblem } from "@/lib/problem";
import { registerSchema } from "@/lib/validation";

type RegisterInput = z.input<typeof registerSchema>;
type RegisterValues = z.output<typeof registerSchema>;
type BannerState = { tone: "error" | "warning"; titleKey?: string; textKey: string } | null;

const linkClass = "font-medium text-foreground underline decoration-border-strong underline-offset-[3px] hover:decoration-foreground";

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [banner, setBanner] = useState<BannerState>(null);
  const [locked, setLocked] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    control,
    getValues,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<RegisterInput, unknown, RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phoneNumber: "", password: "" },
  });

  async function onSubmit(values: RegisterValues) {
    setBanner(null);
    try {
      await registerUser(values);
      navigate("/register/check-email", { state: { email: values.email } });
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      const ui = mapProblem(e.problem, "register");
      if (ui.kind === "fields") {
        for (const [field, key] of Object.entries(ui.fields)) setError(field as keyof RegisterInput, { message: key });
        if (e.problem.status === 400) setBanner({ tone: "error", textKey: "err.400" });
      } else if (ui.kind === "banner") {
        setBanner(ui);
        if (e.problem.status === 429) setLocked(true);
      }
    }
  }

  const password = useWatch({ control, name: "password" });
  const emailTaken = errors.email?.message === "register.err.409";

  return (
    <>
      <AuthHead title={t("register.title")} lead={t("register.lead")} />

      {banner && (
        <Banner tone={banner.tone} title={banner.titleKey && t(banner.titleKey)} className="mb-5">
          {t(banner.textKey)}
        </Banner>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[18px]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[18px]">
          <TextField label={t("f.firstName")} autoComplete="given-name" error={errors.firstName?.message} {...register("firstName")} />
          <TextField label={t("f.lastName")} autoComplete="family-name" error={errors.lastName?.message} {...register("lastName")} />
        </div>
        <div className="flex flex-col gap-2">
          <TextField
            label={t("f.email")}
            type="email"
            autoComplete="email"
            placeholder={t("f.email.ph")}
            error={errors.email?.message}
            {...register("email")}
          />
          {emailTaken && (
            <Link to={`/login?email=${encodeURIComponent(getValues("email").trim())}`} className={`self-start text-[13px] ${linkClass}`}>
              {t("register.err.409.cta")}
            </Link>
          )}
        </div>
        <TextField
          label={t("f.phone")}
          optional
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0888123456"
          hint={t("f.phone.hint")}
          error={errors.phoneNumber?.message}
          {...register("phoneNumber")}
        />
        <div className="flex flex-col gap-2.5">
          <PasswordField label={t("f.password")} autoComplete="new-password" error={errors.password?.message} {...register("password")} />
          <PasswordChecklist value={password} showErrors={isSubmitted} />
        </div>
        <Button type="submit" size="lg" className="mt-1.5 w-full" loading={isSubmitting} disabled={locked}>
          {t("register.submit")}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-body">
        {t("register.haveAccount")}{" "}
        <Link to="/login" className={linkClass}>
          {t("register.toLogin")}
        </Link>
      </p>
    </>
  );
}

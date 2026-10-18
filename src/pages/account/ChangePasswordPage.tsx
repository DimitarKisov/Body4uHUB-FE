// Screen 7 · Смяна на парола — POST /api/users/me/change-password (design: ui_kits/identity/AccountScreens.jsx → ChangePasswordScreen).
// 422 wrong current password → under "Текуща парола" · 400 → field errors · 401 global sign-out · 404 → sign out · other → banner.
// Success → toast + empty form; the session (JWT) stays valid, so the user stays signed in.
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import type { z } from "zod";
import { ApiError } from "@/api/client";
import { changePassword } from "@/api/users";
import { useAuth } from "@/auth/AuthContext";
import { Banner } from "@/components/feedback/Banner";
import { notify } from "@/components/feedback/notify";
import { PasswordChecklist } from "@/components/forms/PasswordChecklist";
import { PasswordField } from "@/components/forms/PasswordField";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mapProblem } from "@/lib/problem";
import { changePasswordSchema } from "@/lib/validation";

type PasswordForm = z.infer<typeof changePasswordSchema>;
type BannerState = { tone: "error" | "warning"; titleKey?: string; textKey: string } | null;

const EMPTY: PasswordForm = { currentPassword: "", newPassword: "" };

export function ChangePasswordPage() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const [banner, setBanner] = useState<BannerState>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<PasswordForm>({ resolver: zodResolver(changePasswordSchema), defaultValues: EMPTY });

  async function onSubmit(values: PasswordForm) {
    setBanner(null);
    try {
      await changePassword(values);
      notify.success(t("pw.saved"));
      reset(EMPTY);
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      const { status } = e.problem;
      if (status === 404) return signOut();
      if (status === 422) return setError("currentPassword", { message: "pw.err.wrong" }, { shouldFocus: true });
      const ui = mapProblem(e.problem, "password");
      if (ui.kind === "fields") {
        for (const [field, key] of Object.entries(ui.fields)) setError(field as keyof PasswordForm, { message: key });
      } else if (ui.kind === "banner") {
        setBanner(ui);
      }
    }
  }

  const newPassword = useWatch({ control, name: "newPassword" });

  return (
    <>
      <PageHeader eyebrow={t("nav.security")} title={t("pw.title")} description={t("pw.lead")} />

      <Card className="max-w-[640px]">
        {banner && (
          <Banner tone={banner.tone} title={banner.titleKey && t(banner.titleKey)} className="mb-5">
            {t(banner.textKey)}
          </Banner>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[18px]">
          <PasswordField label={t("f.currentPassword")} autoComplete="current-password" error={errors.currentPassword?.message} {...register("currentPassword")} />
          <div className="flex flex-col gap-2.5">
            <PasswordField label={t("f.newPassword")} autoComplete="new-password" error={errors.newPassword?.message} {...register("newPassword")} />
            <PasswordChecklist value={newPassword} showErrors={isSubmitted} />
          </div>
          <div className="mt-1.5 flex justify-end">
            <Button type="submit" loading={isSubmitting}>
              {t("pw.submit")}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}

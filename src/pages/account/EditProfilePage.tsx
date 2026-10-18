// Screen 6 · Редакция на профила — PUT /api/users/me (design: ui_kits/identity/AccountScreens.jsx → EditProfileScreen).
// 400 → field errors + banner · 401 global sign-out · 404 (account deleted) → sign out · 422 / 500 / network → banner · success → toast + /profile.
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import type { z } from "zod";
import { ApiError } from "@/api/client";
import type { UserDto } from "@/api/types";
import { meQueryKey, updateMe } from "@/api/users";
import { useAuth } from "@/auth/AuthContext";
import { Banner } from "@/components/feedback/Banner";
import { notify } from "@/components/feedback/notify";
import { TextField } from "@/components/forms/TextField";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { mapProblem } from "@/lib/problem";
import { profileSchema } from "@/lib/validation";

type EditInput = z.input<typeof profileSchema>;
type EditValues = z.output<typeof profileSchema>;
type BannerState = { tone: "error" | "warning"; titleKey?: string; textKey: string } | null;

export function EditProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // RequireAuth guarantees a session; the profile screen keeps this copy in sync with GET /api/users/me.
  const { user: sessionUser, setUser, signOut } = useAuth();
  const user = sessionUser!;
  const [banner, setBanner] = useState<BannerState>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EditInput, unknown, EditValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user.firstName, lastName: user.lastName, phoneNumber: user.phoneNumber ?? "" },
  });

  const toProfile = () => navigate("/profile");

  async function onSubmit(values: EditValues) {
    setBanner(null);
    try {
      await updateMe(values);
      // 204 has no body → apply the saved values locally (session + cached profile).
      const updated: UserDto = { ...user, ...values };
      setUser(updated);
      queryClient.setQueryData(meQueryKey, updated);
      notify.success(t("edit.saved"));
      toProfile();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      if (e.problem.status === 404) return signOut();
      const ui = mapProblem(e.problem, "profile");
      if (ui.kind === "fields") {
        for (const [field, key] of Object.entries(ui.fields)) setError(field as keyof EditInput, { message: key });
        setBanner({ tone: "error", textKey: "err.400" });
      } else if (ui.kind === "banner") {
        setBanner(ui);
      }
    }
  }

  return (
    <>
      <PageHeader back={{ label: t("profile.title"), onClick: toProfile }} title={t("edit.title")} description={t("edit.lead")} />

      <Card className="max-w-[640px]">
        {banner && (
          <Banner tone={banner.tone} title={banner.titleKey && t(banner.titleKey)} className="mb-5">
            {t(banner.textKey)}
          </Banner>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-[18px]">
          <TextField label={t("f.email")} value={user.email} readOnly iconLeft={<Lock />} hint={t("f.email.readonly")} />
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-[18px]">
            <TextField label={t("f.firstName")} autoComplete="given-name" error={errors.firstName?.message} {...register("firstName")} />
            <TextField label={t("f.lastName")} autoComplete="family-name" error={errors.lastName?.message} {...register("lastName")} />
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
          <div className="mt-1.5 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={toProfile}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}

// Screen 4 · Нов линк — POST /api/auth/resend-confirmation (design: ui_kits/identity/AuthScreens.jsx → ResendScreen).
// The API answers 204 for any email, so every outcome except 429 shows the same neutral banner (never reveals whether the email exists).
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import { Mail } from "lucide-react";
import { z } from "zod";
import { resendConfirmation } from "@/api/auth";
import { ApiError } from "@/api/client";
import { Banner } from "@/components/feedback/Banner";
import { TextField } from "@/components/forms/TextField";
import { AuthHead } from "@/components/layout/AuthHead";
import { Button } from "@/components/ui/button";
import { email } from "@/lib/validation";

const resendSchema = z.object({ email });
type ResendForm = z.infer<typeof resendSchema>;

const linkClass = "font-medium text-foreground underline decoration-border-strong underline-offset-[3px] hover:decoration-foreground";

export function ResendConfirmationPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  // "done" = neutral result · "limited" = 429 (3 per 15 min per IP): submit stays locked, as in the design.
  const [result, setResult] = useState<null | "done" | "limited">(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResendForm>({
    resolver: zodResolver(resendSchema),
    defaultValues: { email: params.get("email") ?? "" },
  });

  async function onSubmit(values: ResendForm) {
    setResult(null);
    try {
      await resendConfirmation(values.email);
      setResult("done");
    } catch (e) {
      setResult(e instanceof ApiError && e.problem.status === 429 ? "limited" : "done");
    }
  }

  const typed = useWatch({ control, name: "email" }).trim();
  const loginTo = typed ? `/login?email=${encodeURIComponent(typed)}` : "/login";

  return (
    <>
      <AuthHead title={t("resend.title")} lead={t("resend.lead")} />

      {result === "done" && (
        <Banner tone="info" icon={Mail} className="mb-5">
          {t("resend.done")}
        </Banner>
      )}
      {result === "limited" && (
        <Banner tone="error" title={t("resend.err.429.t")} className="mb-5">
          {t("resend.err.429")}
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
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting} disabled={result === "limited"}>
          {t("resend.submit")}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm">
        <Link to={loginTo} className={linkClass}>
          {t("check.toLogin")}
        </Link>
      </p>
    </>
  );
}

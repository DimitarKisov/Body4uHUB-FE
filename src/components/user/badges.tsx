// User badges shared by the profile and admin screens (design: Badge.jsx → RoleBadge, AccountScreens.jsx → EmailStatus).
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ROLE_TONE = { Administrator: "admin", Trainer: "trainer", User: "user" } as const;

export function RoleBadge({ role }: { role: string }) {
  const { t } = useTranslation();
  const tone = ROLE_TONE[role as keyof typeof ROLE_TONE] ?? "neutral";
  return <Badge tone={tone}>{t(`role.${role}`, { defaultValue: role })}</Badge>;
}

export function EmailStatus({ confirmed }: { confirmed: boolean }) {
  const { t } = useTranslation();
  return confirmed ? (
    <Badge tone="success">
      <Check className="size-[13px]" strokeWidth={2.4} />
      {t("profile.confirmed")}
    </Badge>
  ) : (
    <Badge tone="warning">
      <span className="size-1.5 rounded-full bg-current" />
      {t("profile.unconfirmed")}
    </Badge>
  );
}

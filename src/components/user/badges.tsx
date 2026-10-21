// User badges shared by the profile and admin screens (design: Badge.jsx → RoleBadge, AccountScreens.jsx → EmailStatus,
// AdminScreens.jsx → RoleBadges).
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ROLE_TONE = { Administrator: "admin", Trainer: "trainer", User: "user" } as const;

export function RoleBadge({ role }: { role: string }) {
  const { t } = useTranslation();
  const tone = ROLE_TONE[role as keyof typeof ROLE_TONE] ?? "neutral";
  return <Badge tone={tone}>{t(`role.${role}`, { defaultValue: role })}</Badge>;
}

const ROLE_ORDER = ["Administrator", "Trainer", "User"];
const rank = (role: string) => (ROLE_ORDER.indexOf(role) + 1 || ROLE_ORDER.length + 1);

/** Users table: Администратор → Треньор → Потребител, at most `max` badges, then "+N" (tooltip + sr-only list the rest). */
export function RoleBadges({ roles, max = 2 }: { roles: string[]; max?: number }) {
  const { t } = useTranslation();
  if (!roles.length) {
    return (
      <span className="text-placeholder" title={t("users.roles.none")}>
        <span aria-hidden="true">—</span>
        <span className="sr-only">{t("users.roles.none")}</span>
      </span>
    );
  }
  const sorted = [...roles].sort((a, b) => rank(a) - rank(b));
  const rest = sorted.slice(max);
  const list = rest.map((r) => t(`role.${r}`, { defaultValue: r })).join(", ");
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {sorted.slice(0, max).map((r) => (
        <RoleBadge key={r} role={r} />
      ))}
      {rest.length > 0 && (
        <Badge tone="outline" title={t("users.roles.more", { list })}>
          +{rest.length}
          <span className="sr-only"> {list}</span>
        </Badge>
      )}
    </span>
  );
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

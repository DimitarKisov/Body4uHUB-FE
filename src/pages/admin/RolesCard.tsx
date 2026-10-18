// "Роли и достъп" card on screen 9 — GET /api/roles + POST /api/users/{userId}/roles (design: AdminScreens.jsx → UserDetailsScreen).
// Trainer is never addable here (only via "Направи треньор"); roles the user already has are disabled.
// Errors go to the page banner via onProblem; success → toast + the user is reloaded.
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { ApiError } from "@/api/client";
import { getRoles, rolesQueryKey } from "@/api/roles";
import type { UserDto } from "@/api/types";
import { addUserRoles, userQueryKey } from "@/api/users";
import { notify } from "@/components/feedback/notify";
import { MultiSelect, type SelectOption } from "@/components/forms/MultiSelect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RoleBadge } from "@/components/user/badges";
import { mapProblem } from "@/lib/problem";

export type PageBanner = { tone: "error" | "warning"; titleKey?: string; textKey: string } | null;

export function RolesCard({ user, onProblem }: { user: UserDto; onProblem: (banner: PageBanner) => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const roles = useQuery({ queryKey: rolesQueryKey, queryFn: getRoles, staleTime: Infinity });
  const [pick, setPick] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const has = (roleId: string) => user.roles.some((r) => r.id === roleId);
  const options: SelectOption[] = (roles.data ?? []).map((r) =>
    r.name === "Trainer"
      ? { value: r.id, label: t("role.Trainer"), disabled: true, description: t("user.addRoles.trainerOnly") }
      : { value: r.id, label: t(`role.${r.name}`, { defaultValue: r.name }), disabled: has(r.id), description: has(r.id) ? t("user.addRoles.has") : undefined },
  );
  const addable = pick.filter((id) => !has(id));

  async function add() {
    setBusy(true);
    onProblem(null);
    try {
      await addUserRoles(user.id, addable);
      await queryClient.invalidateQueries({ queryKey: userQueryKey(user.id) });
      setPick([]);
      notify.success(t("user.rolesAdded"));
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      const ui = mapProblem(e.problem, "admin.user");
      // 400 has no field to attach to on this card → generic banner.
      onProblem(ui.kind === "banner" ? ui : { tone: "error", textKey: "err.400" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title={t("user.roles")} description={t("user.roles.lead")}>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {user.roles.map((r) => (
          <RoleBadge key={r.id} role={r.name} />
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-[1_1_220px]">
          <MultiSelect
            label={t("user.addRoles")}
            options={options}
            value={pick}
            onChange={setPick}
            hint={t("user.addRoles.hint")}
            // Without the role list there is nothing to choose from (403/500 on GET /api/roles).
            disabled={!roles.data}
          />
        </div>
        {/* mb-6 lines the button up with the field above its hint line. */}
        <Button variant="dark" className="mb-6" disabled={!addable.length} loading={busy} onClick={add}>
          <Plus />
          {t("user.addRoles.btn")}
        </Button>
      </div>
    </Card>
  );
}

// "Треньорски статус" card on screen 9 — POST /api/users/trainers + DELETE /api/users/trainers/{userId}
// (design: AdminScreens.jsx → UserDetailsScreen). Removing asks first in a destructive ConfirmDialog.
// 409 → warning banner "Потребителят вече е треньор" · other errors → page banner · success → toast + the user is reloaded.
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Dumbbell, UserMinus } from "lucide-react";
import { ApiError } from "@/api/client";
import type { UserDto } from "@/api/types";
import { makeTrainer, removeTrainer, userQueryKey } from "@/api/users";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { notify } from "@/components/feedback/notify";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RoleBadge } from "@/components/user/badges";
import { mapProblem } from "@/lib/problem";
import type { PageBanner } from "@/pages/admin/RolesCard";

export function TrainerCard({ user, onProblem }: { user: UserDto; onProblem: (banner: PageBanner) => void }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<null | "make" | "remove">(null);
  const [confirm, setConfirm] = useState(false);
  const isTrainer = user.roles.some((r) => r.name === "Trainer");
  const name = `${user.firstName} ${user.lastName}`;

  async function run(kind: "make" | "remove", call: () => Promise<unknown>, okKey: string) {
    setBusy(kind);
    onProblem(null);
    try {
      await call();
      await queryClient.invalidateQueries({ queryKey: userQueryKey(user.id) });
      notify.success(t(okKey));
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      const ui = mapProblem(e.problem, "admin.user");
      onProblem(ui.kind === "banner" ? ui : { tone: "error", textKey: "err.400" });
    } finally {
      setBusy(null);
      setConfirm(false);
    }
  }

  return (
    <Card title={t("user.trainer")} action={isTrainer && <RoleBadge role="Trainer" />}>
      <p className="mb-[18px] text-sm text-body">{t(isTrainer ? "user.trainer.yes" : "user.trainer.no")}</p>
      {isTrainer ? (
        <Button variant="secondary" className="text-error-foreground" onClick={() => setConfirm(true)}>
          <UserMinus />
          {t("user.removeTrainer")}
        </Button>
      ) : (
        <Button loading={busy === "make"} onClick={() => run("make", () => makeTrainer(user.id), "user.madeTrainer.ok")}>
          <Dumbbell />
          {t("user.makeTrainer")}
        </Button>
      )}

      <ConfirmDialog
        open={confirm}
        destructive
        icon={<UserMinus />}
        title={t("user.remove.t")}
        description={t("user.remove.text", { name })}
        confirmLabel={t("user.removeTrainer")}
        cancelLabel={t("common.cancel")}
        loading={busy === "remove"}
        onCancel={() => setConfirm(false)}
        onConfirm={() => run("remove", () => removeTrainer(user.id), "user.removed")}
      />
    </Card>
  );
}

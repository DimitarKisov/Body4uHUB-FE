// Чернова = warning + dot · Публикувана = success + globe · Архивирана = neutral + archive (design: content shared.jsx → StatusBadge).
import { useTranslation } from "react-i18next";
import { Archive, Globe } from "lucide-react";
import type { ArticleStatus } from "@/api/content";
import { Badge } from "@/components/ui/badge";

export function ArticleStatusBadge({ status }: { status: ArticleStatus }) {
  const { t } = useTranslation();
  if (status === "Draft") {
    return (
      <Badge tone="warning">
        <span className="size-1.5 rounded-full bg-current" />
        {t("status.Draft")}
      </Badge>
    );
  }
  if (status === "Archived") {
    return (
      <Badge tone="neutral">
        <Archive className="size-[13px]" />
        {t("status.Archived")}
      </Badge>
    );
  }
  return (
    <Badge tone="success">
      <Globe className="size-[13px]" />
      {t("status.Published")}
    </Badge>
  );
}

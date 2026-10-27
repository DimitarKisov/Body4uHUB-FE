// Placeholder for /articles/new and /articles/:id/edit until the editor (C4) exists; C3 already links here.
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import { Pencil } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EditorSoonPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  return (
    <Card padded={false}>
      <EmptyState
        icon={<Pencil />}
        title={t(id ? "editor.edit" : "editor.new")}
        actions={
          <Button asChild variant="secondary">
            <Link to="/articles/mine">{t("mine.title")}</Link>
          </Button>
        }
      >
        {t("soon.text")}
      </EmptyState>
    </Card>
  );
}

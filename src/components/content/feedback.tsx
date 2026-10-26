// Content feedback blocks (design: content shared.jsx → LoadError).
import { useTranslation } from "react-i18next";
import { CircleAlert, RefreshCw } from "lucide-react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** Error EmptyState in a Card, with "Опитай отново". */
export function LoadError({ title, onRetry }: { title?: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <Card padded={false}>
      <EmptyState
        icon={<CircleAlert />}
        tone="error"
        title={title ?? t("err.500.t")}
        actions={
          onRetry && (
            <Button variant="secondary" onClick={onRetry}>
              <RefreshCw />
              {t("common.retry")}
            </Button>
          )
        }
      >
        {t("err.500")}
      </EmptyState>
    </Card>
  );
}

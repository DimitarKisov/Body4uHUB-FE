// Placeholder for modules that don't exist yet (/trainers, /services, /articles, /forum), inside PublicLayout.
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Button } from "@/components/ui/button";
import { publicWrap } from "@/lib/layout";
import type { PublicModule } from "@/lib/modules";

export function SoonPage({ module: { id, icon: Icon } }: { module: PublicModule }) {
  const { t } = useTranslation();
  return (
    <div className={`${publicWrap} py-16`}>
      <EmptyState
        icon={<Icon />}
        title={t(`home.nav.${id}`)}
        actions={
          <Button asChild variant="secondary" className="w-full">
            <Link to="/">{t("soon.home")}</Link>
          </Button>
        }
      >
        {t("soon.text")}
      </EmptyState>
    </div>
  );
}

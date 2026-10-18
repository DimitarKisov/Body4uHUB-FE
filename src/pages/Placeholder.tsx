// Temporary stand-in until each screen is implemented (see design_handoff_identity/README.md → Screens & states).
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/PageHeader";

export function Placeholder({ titleKey, auth = false }: { titleKey: string; auth?: boolean }) {
  const { t } = useTranslation();
  const note = <div className="rounded-lg border border-dashed border-border-strong p-6 text-sm text-muted-foreground">TODO · {titleKey}</div>;
  if (auth) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-[28px] leading-[34px]">{t(titleKey)}</h1>
        {note}
      </div>
    );
  }
  return (
    <>
      <PageHeader title={t(titleKey)} />
      {note}
    </>
  );
}

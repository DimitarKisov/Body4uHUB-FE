// Public screens. Mobile: single column, logo on top. ≥1024px: graphite brand panel (5fr) + form (6fr).
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Outlet } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";

export function AuthLayout({ children }: { children?: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="grid min-h-screen grid-cols-1 bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside aria-hidden="true" className="m-3 hidden flex-col justify-between rounded-lg bg-secondary p-10 text-secondary-foreground lg:flex">
        <Logo size="md" variant="accent" onDark />
        <div className="max-w-[420px]">
          <p className="font-display text-[36px] leading-[42px] font-semibold tracking-[-0.03em] text-balance text-card">{t("brand.tagline")}</p>
          <p className="mt-4 text-[15px] leading-6 text-border-strong">{t("brand.panel")}</p>
        </div>
        <span className="text-xs text-placeholder">© Body4uHUB</span>
      </aside>
      <div className="flex flex-col px-5 pt-5 pb-8 lg:px-12 lg:py-8">
        <div className="lg:hidden"><Logo size="sm" /></div>
        <main className="m-auto w-full max-w-[420px] py-10">{children ?? <Outlet />}</main>
      </div>
    </div>
  );
}

// Public footer (design: ui_kits/home/Home.jsx → Footer). "Body4uHUB" column has no pages yet → muted text + "скоро".
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Badge } from "@/components/ui/badge";
import { publicWrap } from "@/lib/layout";
import { MODULES } from "@/lib/modules";

const heading = "mb-3 text-xs leading-4 font-semibold tracking-[0.06em] text-muted-foreground uppercase";
const link = "text-sm text-body hover:text-foreground hover:underline hover:underline-offset-[3px]";

export function PublicFooter() {
  const { t } = useTranslation();
  const account = [
    { to: "/login", label: t("home.login") },
    { to: "/register", label: t("home.register") },
    { to: "/resend-confirmation", label: t("home.foot.resend") },
  ];

  return (
    <footer className="mt-12 border-t border-border pt-10 pb-8">
      <div className={publicWrap}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-8">
          <div>
            <Link to="/" className="inline-flex rounded-sm">
              <Logo size="sm" />
            </Link>
            <p className="mt-3.5 max-w-[240px] text-sm text-body">{t("brand.tagline")}</p>
          </div>
          <div>
            <h4 className={heading}>{t("home.foot.platform")}</h4>
            <ul className="flex flex-col gap-2.5">
              {MODULES.map((m) => (
                <li key={m.id}><Link to={m.to} className={link}>{t(`home.nav.${m.id}`)}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className={heading}>{t("home.foot.account")}</h4>
            <ul className="flex flex-col gap-2.5">
              {account.map((a) => (
                <li key={a.to}><Link to={a.to} className={link}>{a.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className={heading}>Body4uHUB</h4>
            <ul className="flex flex-col gap-2.5">
              {(["about", "contacts", "terms", "privacy"] as const).map((k) => (
                <li key={k} className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">{t(`home.foot.${k}`)}</span>
                  <Badge tone="outline" className="h-[18px] px-1.5 text-[10px]">{t("common.soon")}</Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap justify-between gap-4 border-t border-border pt-5 text-[13px] leading-[18px] text-muted-foreground">
          <span>{t("home.foot.copy")}</span>
          <span>{t("home.foot.tagline")}</span>
        </div>
      </div>
    </footer>
  );
}

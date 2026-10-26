// Public sticky header (design: ui_kits/home/Home.jsx → PublicHeader). ≥900px: nav links + Вход / Създай профил.
// <900px: menu button → sheet under the header. Signed in: avatar + "Моят профил" instead of the auth buttons.
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { Logo } from "@/components/brand/Logo";
import { UserAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { publicWrap } from "@/lib/layout";
import { MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";


export function PublicHeader() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  // From a module page (Статии …) Вход comes back to it; from the home page GuestOnly picks the profile.
  const loginTo = pathname === "/" ? "/login" : `/login?returnTo=${encodeURIComponent(pathname + search)}`;
  // The sheet remembers the page it was opened on, so navigating anywhere closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenOn(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b border-transparent bg-topbar backdrop-blur-md backdrop-saturate-[1.4] transition-colors duration-[180ms]",
          (scrolled || open) && "border-border",
        )}
      >
        <div className={cn(publicWrap, "flex h-16 items-center justify-between gap-4")}>
          <Link to="/" className="inline-flex rounded-sm" onClick={() => setOpenOn(null)}>
            <Logo size="sm" />
          </Link>

          <nav aria-label={t("home.nav.label")} className="hidden gap-1 min-[900px]:flex">
            {MODULES.map((m) => (
              <Link key={m.id} to={m.to} className="inline-flex h-10 items-center rounded-md px-3.5 text-sm leading-none font-medium text-body hover:bg-muted hover:text-foreground">
                {t(`home.nav.${m.id}`)}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild variant="ghost" size="sm" className="gap-2.5 pl-1.5">
                <Link to="/profile" aria-label={t("nav.profile")}>
                  <UserAvatar user={user} className="size-7 text-[11px]" />
                  <span className="hidden min-[900px]:inline">{t("nav.profile")}</span>
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to={loginTo}>{t("home.login")}</Link>
                </Button>
                <Button asChild size="sm" className="hidden min-[900px]:inline-flex">
                  <Link to="/register">{t("home.register")}</Link>
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-9 px-0 min-[900px]:hidden"
              aria-label={t(open ? "home.menu.close" : "home.menu.open")}
              aria-expanded={open}
              aria-controls="public-menu"
              onClick={() => setOpenOn(open ? null : pathname)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </header>

      {open && (
        <div
          id="public-menu"
          role="dialog"
          aria-label={t("home.menu")}
          className="fixed inset-x-0 top-16 z-[39] flex flex-col gap-1 border-b border-border bg-background px-4 pt-3 pb-5 animate-in fade-in-0 slide-in-from-bottom-1.5 duration-[180ms] min-[900px]:hidden"
        >
          {MODULES.map(({ id, to, icon: Icon }) => (
            <Link key={id} to={to} className="flex h-12 items-center gap-3 rounded-md px-3 text-base leading-none font-medium text-foreground hover:bg-muted [&_svg]:size-5">
              <Icon />
              {t(`home.nav.${id}`)}
            </Link>
          ))}
          <div className="mt-3">
            <Button asChild size="lg" className="w-full">
              {user ? <Link to="/profile">{t("nav.profile")}</Link> : <Link to="/register">{t("home.register")}</Link>}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

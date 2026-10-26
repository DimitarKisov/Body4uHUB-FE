// Signed-in shell. ≥1024px: 248px sidebar + sticky 60px top bar. <1024px: top bar with logo + fixed 64px bottom nav.
// Also hosts the session notices: the warning banner above the page content and the "Сесията изтече" dialog.
import { Suspense } from "react";
import { CalendarDays, FileText, KeyRound, LogOut, User, Users, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Logo } from "@/components/brand/Logo";
import { SessionExpiredDialog, SessionWarning } from "@/components/feedback/SessionNotices";
import { UserAvatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface NavItem { id: string; to?: string; icon: LucideIcon; label: string; shortLabel?: string; soon?: boolean }

function useNav() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("Administrator");
  const profile: NavItem = { id: "profile", to: "/profile", icon: User, label: t("nav.profile"), shortLabel: t("nav.profile.short") };
  const security: NavItem = { id: "security", to: "/security", icon: KeyRound, label: t("nav.security") };
  // Статии is a public page (PublicLayout); the link leaves the shell.
  const content: NavItem = { id: "content", to: "/articles", icon: FileText, label: t("nav.articles") };
  const services: NavItem = { id: "services", icon: CalendarDays, label: t("nav.services"), shortLabel: t("nav.services.short"), soon: true };
  const users: NavItem = { id: "users", to: "/admin/users", icon: Users, label: t("nav.users") };
  const sections = [
    { title: t("nav.account"), items: [profile, security] },
    { title: t("nav.modules"), items: [content, services] },
    ...(isAdmin ? [{ title: t("nav.admin"), items: [users] }] : []),
  ];
  const mobile = isAdmin ? [profile, security, users, content] : [profile, security, content, services];
  return { sections, mobile };
}

const sideItem = "flex h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm leading-none font-medium text-body transition-colors duration-[120ms] [&_svg]:size-[18px]";

function SideNavItem({ item }: { item: NavItem }) {
  const { t } = useTranslation();
  const Icon = item.icon;
  if (item.soon || !item.to) {
    return (
      <span aria-disabled="true" className={cn(sideItem, "cursor-default text-placeholder")}>
        <Icon /><span>{item.label}</span><span className="ml-auto text-[11px] font-medium">{t("common.soon")}</span>
      </span>
    );
  }
  return (
    <NavLink to={item.to} className={({ isActive }) => cn(sideItem, isActive ? "bg-secondary text-secondary-foreground [&_svg]:text-primary" : "hover:bg-muted hover:text-foreground")}>
      <Icon /><span>{item.label}</span>
    </NavLink>
  );
}

const bottomItem = "relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] leading-none font-medium [&_svg]:size-[22px] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:shadow-[inset_0_0_0_2px_var(--ring)]";

function BottomNavItem({ item }: { item: NavItem }) {
  const Icon = item.icon;
  const label = item.shortLabel ?? item.label;
  if (item.soon || !item.to) {
    return <span aria-disabled="true" className={cn(bottomItem, "text-border-strong")}><Icon /><span>{label}</span></span>;
  }
  return (
    <NavLink to={item.to} className={({ isActive }) => cn(bottomItem, isActive
      ? "text-foreground before:absolute before:inset-x-[30%] before:top-0 before:h-[3px] before:rounded-b-[3px] before:bg-foreground"
      : "text-muted-foreground")}>
      <Icon /><span>{label}</span>
    </NavLink>
  );
}

export function AppShell() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { sections, mobile } = useNav();

  const logout = () => { signOut(); navigate("/login", { replace: true }); };

  return (
    <div className="flex min-h-screen bg-background">
      <aside aria-label="Основна навигация" className="sticky top-0 hidden h-screen w-[248px] flex-none flex-col gap-1 border-r border-border bg-background px-3.5 py-5 lg:flex">
        <div className="px-2.5 pt-1 pb-6"><Link to="/" className="inline-flex rounded-sm"><Logo size="sm" /></Link></div>
        {sections.map((s) => (
          <div key={s.title} className="flex flex-col gap-0.5">
            <div className="px-3 pt-4 pb-1.5 text-xs leading-4 font-semibold tracking-[0.06em] text-muted-foreground uppercase">{s.title}</div>
            {s.items.map((it) => <SideNavItem key={it.id} item={it} />)}
          </div>
        ))}
        <div className="mt-auto flex flex-col gap-1 border-t border-border pt-3">
          <button type="button" onClick={logout} className={cn(sideItem, "hover:bg-muted hover:text-foreground")}>
            <LogOut /><span>{t("nav.logout")}</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between gap-3 border-b border-border bg-topbar px-4 backdrop-blur-md backdrop-saturate-[1.4] lg:px-8">
          <Link to="/" className="inline-flex rounded-sm lg:hidden"><Logo size="sm" /></Link>
          <div className="ml-auto flex items-center gap-2.5">
            {user && (
              <span title={`${user.firstName} ${user.lastName}`} className="inline-flex"><UserAvatar user={user} /></span>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1120px] flex-1 px-4 pt-6 pb-24 lg:px-8 lg:pt-10 lg:pb-16">
          <SessionWarning />
          <Suspense fallback={null}><Outlet /></Suspense>
        </main>
      </div>

      <nav aria-label="Основна навигация" className="fixed inset-x-0 bottom-0 z-30 flex h-16 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
        {mobile.map((it) => <BottomNavItem key={it.id} item={it} />)}
      </nav>
      <SessionExpiredDialog />
    </div>
  );
}

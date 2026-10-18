// Public pages (home, "скоро" modules): PublicHeader + content + PublicFooter. Not the AppShell.
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { PublicHeader } from "@/components/layout/PublicHeader";

export function PublicLayout() {
  const { pathname, hash } = useLocation();
  // New page → start at the top (in-page #anchors scroll on their own).
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}

// Toast host + toast card (design: components/feedback/Toast.jsx, components.css .b4u-toaster / .b4u-toast).
// Bottom-right; on phones 16px gutters, 16px above the 64px bottom nav (AppShell). Screens show toasts with `notify` (./notify.tsx).
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { Toaster as Sonner } from "sonner";
import { cn } from "@/lib/utils";

export type ToastTone = "success" | "error" | "info";

const TONE = {
  success: { Icon: CircleCheck, className: "text-primary" },
  error: { Icon: CircleAlert, className: "text-toast-error" },
  info: { Icon: Info, className: "text-toast-info" },
};

export function Toast({ tone, title, text, onClose }: { tone: ToastTone; title: ReactNode; text?: ReactNode; onClose: () => void }) {
  const { t } = useTranslation();
  const { Icon, className } = TONE[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="flex w-full max-w-[380px] items-start gap-3 rounded-lg bg-secondary py-3.5 pr-3.5 pl-4 text-sm text-secondary-foreground shadow-lg"
    >
      <Icon className={cn("mt-px size-5 flex-none", className)} />
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        {text && <p className="mt-0.5 text-border-strong">{text}</p>}
      </div>
      <button type="button" onClick={onClose} aria-label={t("common.close")} className="ml-auto inline-flex rounded-[6px] p-0.5 text-border-strong hover:text-card">
        <X className="size-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  return <Sonner position="bottom-right" offset={24} mobileOffset={{ bottom: 80, left: 16, right: 16 }} gap={8} toastOptions={{ unstyled: true }} />;
}

// Inline alert (design: components/feedback/Banner.jsx). Tinted bg, no border, 20px tone icon.
import type { HTMLAttributes, ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type BannerTone = "info" | "success" | "warning" | "error" | "neutral";

const TONE: Record<BannerTone, { bg: string; icon: string; Icon: typeof Info }> = {
  info: { bg: "bg-info-subtle", icon: "text-info", Icon: Info },
  success: { bg: "bg-success-subtle", icon: "text-success", Icon: CircleCheck },
  warning: { bg: "bg-warning-subtle", icon: "text-warning", Icon: TriangleAlert },
  error: { bg: "bg-error-subtle", icon: "text-error", Icon: CircleAlert },
  neutral: { bg: "bg-muted", icon: "text-foreground", Icon: Info },
};

interface BannerProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: BannerTone;
  title?: ReactNode;
  actions?: ReactNode;
  /** Overrides the tone icon (design: Banner `icon`). */
  icon?: LucideIcon;
}

export function Banner({ tone = "info", title, actions, icon: CustomIcon, children, className, ...rest }: BannerProps) {
  const { bg, icon, Icon: ToneIcon } = TONE[tone];
  const Icon = CustomIcon ?? ToneIcon;
  return (
    <div role={tone === "error" || tone === "warning" ? "alert" : "status"} className={cn("flex items-start gap-3 rounded-lg px-3.5 py-3 text-sm sm:px-4 sm:py-3.5", bg, className)} {...rest}>
      <Icon className={cn("mt-px size-5 shrink-0", icon)} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {title && <p className="font-semibold text-foreground">{title}</p>}
        {children && <div className="text-body">{children}</div>}
        {actions && <div className="mt-2.5 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

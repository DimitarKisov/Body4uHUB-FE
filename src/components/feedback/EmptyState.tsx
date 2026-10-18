// Centered icon tile + title + text + stacked actions (design: components/feedback/EmptyState.jsx).
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONE = {
  neutral: "bg-muted text-foreground",
  accent: "bg-primary text-primary-foreground",
  error: "bg-error-subtle text-error",
  warning: "bg-warning-subtle text-warning-foreground",
};

interface EmptyStateProps {
  icon: ReactNode;
  tone?: keyof typeof TONE;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon, tone = "neutral", title, children, actions, compact }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-1.5 text-center", compact ? "px-4 py-7" : "px-4 py-9 sm:px-6 sm:py-12")}>
      <div className={cn("mb-3 flex size-14 items-center justify-center rounded-lg [&_svg]:size-[26px]", TONE[tone])}>{icon}</div>
      <h2 className="text-xl leading-[26px] tracking-[-0.015em]">{title}</h2>
      {children && <div className="max-w-[360px] text-sm text-body">{children}</div>}
      {actions && <div className="mt-[18px] flex w-full max-w-[320px] flex-col gap-2">{actions}</div>}
    </div>
  );
}

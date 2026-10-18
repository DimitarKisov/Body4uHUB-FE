// shadcn-style Badge, re-themed (design: components/core/Badge.jsx). h24, pill, Inter 600 12px.
import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex h-6 items-center gap-[5px] whitespace-nowrap rounded-full border border-transparent px-2.5 text-xs leading-none font-semibold tracking-[.01em]",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-body",
        admin: "bg-role-admin text-role-admin-foreground",
        trainer: "bg-role-trainer text-role-trainer-foreground",
        user: "bg-role-user text-role-user-foreground",
        success: "bg-success-subtle text-success-foreground",
        warning: "bg-warning-subtle text-warning-foreground",
        error: "bg-error-subtle text-error-foreground",
        info: "bg-info-subtle text-info-foreground",
        outline: "border-border-strong bg-transparent text-body",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({ tone, className, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

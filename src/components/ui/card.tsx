// Surface container (design: components/core/Card.jsx). Mobile-first padding: 20px, 24px from sm.
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  /** Right-aligned header slot (button, badge). */
  action?: ReactNode;
  /** Body padding. Default true. */
  padded?: boolean;
  /** Elevated variant (shadow-md, no border). */
  raised?: boolean;
}

export function Card({ title, description, action, padded = true, raised, children, className, ...rest }: CardProps) {
  const head = title || action;
  const pad = "p-5 sm:p-6";
  return (
    <section
      className={cn("rounded-lg border border-border bg-card text-card-foreground", raised && "border-transparent shadow-md", !head && padded && pad, className)}
      {...rest}
    >
      {head && (
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6 sm:py-5">
          <div>
            {title && <h3 className="text-base leading-[22px] tracking-[-0.01em]">{title}</h3>}
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {head ? <div className={cn(padded && pad)}>{children}</div> : children}
    </section>
  );
}

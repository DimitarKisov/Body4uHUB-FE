import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageHeader({ eyebrow, title, description, actions, back }: {
  eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode; back?: { label: string; onClick: () => void };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back && (
          <Button variant="ghost" size="sm" className="-ml-3 mb-3 [&_svg]:size-4" onClick={back.onClick}>
            <ArrowLeft />{back.label}
          </Button>
        )}
        {eyebrow && <div className="mb-2 text-xs leading-4 font-semibold tracking-[0.06em] text-muted-foreground uppercase">{eyebrow}</div>}
        <h1 className="text-[26px] leading-8 md:text-[32px] md:leading-[38px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-[560px] text-sm text-body">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

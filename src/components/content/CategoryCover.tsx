// Category cover (design: content shared.jsx → CategoryCover). The API has no coverImageUrl → tinted block + centred Lucide icon.
// Size it with className: 72×72 mobile rows, 16:9 desktop cards, 48×48 in Моите статии, 120/200px article hero.
import { Apple, Dumbbell, FileText, Lightbulb, Moon, type LucideIcon } from "lucide-react";
import type { ArticleCategory } from "@/api/content";
import { cn } from "@/lib/utils";

const CATEGORY: Record<ArticleCategory, { Icon: LucideIcon; bg: string }> = {
  Training: { Icon: Dumbbell, bg: "bg-cat-training" },
  Nutrition: { Icon: Apple, bg: "bg-cat-nutrition" },
  Recovery: { Icon: Moon, bg: "bg-cat-recovery" },
  Other: { Icon: Lightbulb, bg: "bg-cat-other" },
};

export function CategoryCover({ category, iconSize = 28, className }: { category: ArticleCategory | string; iconSize?: number; className?: string }) {
  const c = CATEGORY[category as ArticleCategory];
  const Icon = c?.Icon ?? FileText;
  return (
    <div aria-hidden="true" className={cn("flex flex-none items-center justify-center overflow-hidden rounded-md text-foreground", c?.bg ?? "bg-muted", className)}>
      <Icon size={iconSize} strokeWidth={1.75} />
    </div>
  );
}

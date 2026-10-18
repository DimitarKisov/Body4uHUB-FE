// Loading placeholder block (design: components/core/Skeleton.jsx). Size it with className (h-*, w-*, rounded-full).
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("block animate-skel rounded-sm bg-muted", className)} />;
}

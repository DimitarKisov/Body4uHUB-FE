// Stand-in for photos that don't exist yet (design: ui_kits/home <image-slot>). Decorative only.
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ImagePlaceholder({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex size-full items-center justify-center bg-muted text-placeholder", className)}>
      <ImageIcon className="size-6" />
    </div>
  );
}

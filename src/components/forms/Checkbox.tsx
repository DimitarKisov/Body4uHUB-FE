// Checkbox with label (design: components/forms/Checkbox.jsx). Native input kept for a11y, drawn as a 20px box.
import type { InputHTMLAttributes, ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Checkbox({ label, className, disabled, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-start gap-2.5 text-sm text-foreground", disabled && "cursor-not-allowed text-muted-foreground", className)}>
      <input type="checkbox" disabled={disabled} className="peer sr-only" {...rest} />
      <span
        aria-hidden="true"
        className="inline-flex size-5 flex-none items-center justify-center rounded-[6px] border-[1.5px] border-border-strong bg-card text-transparent transition-colors duration-[120ms] peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:shadow-[0_0_0_3px_rgb(26_27_24/.10)] peer-disabled:opacity-50"
      >
        <Check className="size-[13px]" strokeWidth={3} />
      </span>
      <span>{label}</span>
    </label>
  );
}

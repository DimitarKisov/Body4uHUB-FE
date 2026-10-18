// Multi-choice dropdown with removable chips (design: components/forms/Select.jsx → MultiSelect).
// Trigger looks like a TextField; the menu closes on Escape or a click outside.
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, X } from "lucide-react";
import { FieldMessage, inputClass } from "@/components/forms/TextField";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  /** Secondary line, e.g. why an option is disabled. */
  description?: ReactNode;
  disabled?: boolean;
}

interface MultiSelectProps {
  label: string;
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  hint?: ReactNode;
  error?: string;
  disabled?: boolean;
}

export function MultiSelect({ label, options, value, onChange, hint, error, disabled }: MultiSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const fid = useId();
  const mid = `${fid}-msg`;
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="flex min-w-0 flex-col gap-1.5" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <span id={`${fid}-l`} className="text-sm font-medium text-foreground">
        {label}
      </span>
      <div className="relative flex items-center">
        <button
          type="button"
          id={fid}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={`${fid}-l ${fid}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? mid : undefined}
          onClick={() => setOpen(!open)}
          className={cn(inputClass, "flex h-auto min-h-11 cursor-pointer flex-wrap items-center gap-1.5 py-1.5 pr-10 text-left")}
        >
          {value.length ? (
            value.map((v) => {
              const o = options.find((x) => x.value === v);
              const name = o?.label ?? v;
              return (
                <span key={v} className="inline-flex h-[26px] items-center gap-1 rounded-sm bg-muted pr-1 pl-2.5 text-[13px] leading-none font-medium text-foreground">
                  {name}
                  {/* A <button> can't nest inside the trigger button → role="button" span, as in the design. */}
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={t("common.removeItem", { label: name })}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(v);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        toggle(v);
                      }
                    }}
                    className="inline-flex cursor-pointer rounded-[4px] p-0.5 text-muted-foreground hover:bg-border-strong hover:text-foreground"
                  >
                    <X className="size-3" strokeWidth={2.6} />
                  </span>
                </span>
              );
            })
          ) : (
            <span className="text-placeholder">{t("common.choose")}</span>
          )}
        </button>
        <ChevronDown className="pointer-events-none absolute right-3.5 size-[18px] text-muted-foreground" />
        {open && (
          <div
            role="listbox"
            aria-multiselectable="true"
            className="absolute top-[calc(100%+6px)] right-0 left-0 z-40 max-h-[280px] animate-in overflow-auto rounded-lg border border-border bg-popover p-1.5 shadow-lg fade-in-0 slide-in-from-top-1"
          >
            {options.map((o) => {
              const on = value.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={on}
                  disabled={o.disabled}
                  onClick={() => toggle(o.value)}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-sm p-2.5 text-left text-sm text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:bg-transparent disabled:text-muted-foreground"
                >
                  <span
                    className={cn(
                      "inline-flex size-5 flex-none items-center justify-center rounded-[6px] border-[1.5px] border-border-strong bg-card text-transparent",
                      on && "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    <Check className="size-[13px]" strokeWidth={3} />
                  </span>
                  <span className="flex-1">
                    {o.label}
                    {o.description && <span className="block text-xs leading-4 text-muted-foreground">{o.description}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <FieldMessage id={mid} error={error} hint={hint} />
    </div>
  );
}

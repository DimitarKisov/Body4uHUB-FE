// Multi-line field with the TextField anatomy (label, hint/error, aria) + a live "n / max" counter (design: content shared.jsx → TextArea).
// The counter turns red past `max`; the API limits are checked on submit, so typing past them is allowed.
import { forwardRef, useId, type ReactNode, type TextareaHTMLAttributes } from "react";
import { useTranslation } from "react-i18next";
import { FieldMessage, inputClass } from "@/components/forms/TextField";
import { cn } from "@/lib/utils";

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "value"> {
  label: string;
  /** Visually hidden label (inline composers that already show a context line). */
  hideLabel?: boolean;
  value: string;
  hint?: ReactNode;
  /** i18n key. */
  error?: string;
  max?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hideLabel, value, hint, error, max, id, rows = 4, className, ...rest }, ref) => {
    const { t } = useTranslation();
    const autoId = useId();
    const fid = id ?? autoId;
    const mid = `${fid}-msg`;
    const over = max !== undefined && value.length > max;
    return (
      <div className="flex min-w-0 flex-col gap-1.5">
        <label htmlFor={fid} className={cn("text-sm font-medium text-foreground", hideLabel && "sr-only")}>
          {label}
        </label>
        <textarea
          ref={ref}
          id={fid}
          rows={rows}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={mid}
          className={cn(inputClass, "h-auto min-h-24 resize-y px-3.5 py-3 leading-6", className)}
          {...rest}
        />
        <div className="flex items-start justify-between gap-3">
          <FieldMessage id={mid} error={error} hint={hint} />
          {max !== undefined && (
            <span aria-live="polite" className={cn("tabular ml-auto text-xs leading-4 whitespace-nowrap text-muted-foreground", over && "font-medium text-error-foreground")}>
              {t("content.counter", { n: value.length, max })}
            </span>
          )}
        </div>
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

/** Hint + counter for a single-line TextField (title fields). */
export function HintWithCounter({ hint, length, max }: { hint: ReactNode; length: number; max: number }) {
  const { t } = useTranslation();
  return (
    <span className="flex justify-between gap-3">
      <span>{hint}</span>
      <span className={cn("tabular whitespace-nowrap", length > max && "font-medium text-error-foreground")}>{t("content.counter", { n: length, max })}</span>
    </span>
  );
}

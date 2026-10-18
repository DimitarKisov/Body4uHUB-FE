// Label + input + hint/error (design: components/forms/TextField.jsx). `error` is an i18n key.
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: ReactNode }) {
  const { t } = useTranslation();
  if (error) {
    return (
      <p id={id} role="alert" className="flex items-start gap-1.5 text-[13px] leading-[18px] font-medium text-error-foreground">
        <CircleAlert className="mt-px size-3.5 shrink-0" />
        {t(error, { defaultValue: t("err.400") })}
      </p>
    );
  }
  if (hint) return <p id={id} className="text-[13px] leading-[18px] text-muted-foreground">{hint}</p>;
  return null;
}

export const inputClass =
  "h-11 w-full appearance-none rounded-md border border-input bg-card px-3.5 text-base text-foreground transition-[border-color,box-shadow] duration-[120ms] " +
  "hover:not-focus:not-disabled:border-border-strong focus:border-ring focus:shadow-[0_0_0_3px_rgb(26_27_24/.10)] focus-visible:ring-0 focus-visible:ring-offset-0 " +
  "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground read-only:bg-muted read-only:text-muted-foreground " +
  "aria-invalid:border-error aria-invalid:focus:shadow-[0_0_0_3px_rgb(214_69_69/.14)]";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  iconLeft?: ReactNode;
  trailing?: ReactNode;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, optional, hint, error, iconLeft, trailing, id, className, ...rest }, ref) => {
    const { t } = useTranslation();
    const autoId = useId();
    const fid = id ?? autoId;
    const mid = `${fid}-msg`;
    return (
      <div className="flex min-w-0 flex-col gap-1.5">
        <label htmlFor={fid} className="flex justify-between gap-2 text-sm font-medium text-foreground">
          <span>{label}</span>
          {optional && <span className="font-normal text-muted-foreground">{t("common.optional")}</span>}
        </label>
        <div className="relative flex items-center">
          {iconLeft && <span className="pointer-events-none absolute left-3.5 flex text-muted-foreground [&_svg]:size-[18px]">{iconLeft}</span>}
          <input
            ref={ref}
            id={fid}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? mid : undefined}
            className={cn(inputClass, iconLeft && "pl-[42px]", trailing && "pr-12", className)}
            {...rest}
          />
          {trailing && <span className="absolute right-1 flex">{trailing}</span>}
        </div>
        <FieldMessage id={mid} error={error} hint={hint} />
      </div>
    );
  },
);
TextField.displayName = "TextField";

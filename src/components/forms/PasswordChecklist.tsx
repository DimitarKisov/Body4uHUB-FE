// Strength bar + rule list for new passwords (design: components/forms/PasswordField.jsx → PasswordChecklist).
// showErrors: after a failed submit, unmet rules turn red.
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/validation";
import { cn } from "@/lib/utils";

export function PasswordChecklist({ value, showErrors = false }: { value: string; showErrors?: boolean }) {
  const { t } = useTranslation();
  const results = PASSWORD_RULES.map((r) => ({ ...r, ok: r.test(value) }));
  const passed = results.filter((r) => r.ok).length;
  const full = passed === results.length;
  const on = Math.round((passed / results.length) * 5);

  return (
    <div>
      <div aria-hidden="true" className="mt-0.5 grid grid-cols-5 gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={cn("h-[3px] rounded-[2px] bg-border transition-colors duration-[180ms]", i < on && "bg-foreground", full && "bg-primary-active")} />
        ))}
      </div>
      <ul aria-label={t("pw.rules")} className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {results.map((r) => {
          const fail = showErrors && !r.ok;
          return (
            <li key={r.id} className={cn("flex items-center gap-2 text-[13px] leading-[18px] text-muted-foreground transition-colors duration-[180ms]", r.ok && "text-foreground", fail && "text-error-foreground")}>
              <span
                className={cn(
                  "inline-flex size-4 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border-strong transition-all duration-[180ms] ease-out",
                  r.ok && "border-primary bg-primary text-primary-foreground",
                  fail && "border-error",
                )}
              >
                {r.ok && <Check className="size-[11px]" strokeWidth={3.2} />}
              </span>
              {t(r.key)}
              <span className="sr-only">{r.ok ? " — изпълнено" : " — не е изпълнено"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

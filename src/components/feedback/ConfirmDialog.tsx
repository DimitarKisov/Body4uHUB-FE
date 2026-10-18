// Confirmation dialog (design: components/feedback/Dialog.jsx → ConfirmDialog).
// Phone: bottom sheet with stacked actions; from sm: centered, actions in a row. Escape / backdrop = cancel
// (not while loading); focus starts on the first button (Отказ) and returns to the opener on close.
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

export function ConfirmDialog({ open, onCancel, onConfirm, title, description, confirmLabel, cancelLabel, destructive, loading, icon }: ConfirmDialogProps) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const textId = useId();
  const cancel = () => !loading && onCancel();

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      opener?.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex animate-in items-end justify-center bg-overlay fade-in-0 sm:items-center sm:p-6"
      onClick={cancel}
      onKeyDown={(e) => e.key === "Escape" && cancel()}
    >
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? textId : undefined}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] animate-in rounded-t-lg bg-popover p-6 shadow-lg fade-in-0 slide-in-from-bottom-2 sm:rounded-lg"
      >
        <div
          className={cn(
            "mb-4 flex size-11 items-center justify-center rounded-md [&_svg]:size-[22px]",
            destructive ? "bg-error-subtle text-error" : "bg-muted text-foreground",
          )}
        >
          {icon ?? <TriangleAlert />}
        </div>
        <h2 id={titleId} className="text-xl leading-[26px] tracking-[-0.015em]">
          {title}
        </h2>
        {description && (
          <p id={textId} className="mt-2 text-sm text-body">
            {description}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Text composer for comments, replies, posts and inline edits (design: content Comments.jsx → Composer).
// Validates the trimmed length on submit; 400 → field error; 404 / 422 / 429 / 500 → banner above, the text is kept.
// 401 is left to the session dialog. Cmd/Ctrl+Enter submits, Esc cancels (when there is a cancel).
import { useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Send } from "lucide-react";
import { ApiError } from "@/api/client";
import { ProblemBanner } from "@/components/content/feedback";
import { Textarea } from "@/components/forms/Textarea";
import { Button } from "@/components/ui/button";
import { lengthOk } from "@/lib/content";
import { commentBanner, type BannerCopy, type ProblemDetails } from "@/lib/problem";

interface ComposerProps {
  label: string;
  /** Shown instead of the (then visually hidden) label, e.g. "Отговаряш на …". */
  context?: ReactNode;
  placeholder?: string;
  submitLabel: string;
  initial?: string;
  min: number;
  max: number;
  /** i18n key for a length error. */
  lengthKey: string;
  /** API problem → banner copy; comments by default (forum posts bring their own later). */
  toBanner?: (p: ProblemDetails) => BannerCopy;
  autoFocus?: boolean;
  /** Throws ApiError on failure; the text is cleared after it resolves. */
  onSubmit: (text: string) => Promise<void>;
  onCancel?: () => void;
}

export function Composer({ label, context, placeholder, submitLabel, initial = "", min, max, lengthKey, toBanner = commentBanner, autoFocus, onSubmit, onCancel }: ComposerProps) {
  const { t } = useTranslation();
  const [text, setText] = useState(initial);
  const [error, setError] = useState<string>();
  const [problem, setProblem] = useState<ProblemDetails | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    if (busy) return;
    if (!lengthOk(text, min, max)) {
      setError(lengthKey);
      return;
    }
    setBusy(true);
    setError(undefined);
    setProblem(null);
    try {
      await onSubmit(text.trim());
      setText("");
    } catch (x) {
      if (!(x instanceof ApiError)) throw x;
      if (x.problem.status === 400) setError(lengthKey);
      else if (x.problem.status !== 401) setProblem(x.problem);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={submit} noValidate>
      {context}
      {problem && <ProblemBanner copy={toBanner(problem)} status={problem.status} />}
      <Textarea
        label={label}
        hideLabel={!!context}
        placeholder={placeholder}
        value={text}
        rows={3}
        max={max}
        error={error}
        autoFocus={autoFocus}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError(undefined);
        }}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void submit();
          if (e.key === "Escape" && onCancel) onCancel();
        }}
      />
      <div className="flex flex-wrap items-center justify-end gap-2">
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        )}
        <Button type="submit" size="sm" variant="dark" loading={busy}>
          {!busy && <Send />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

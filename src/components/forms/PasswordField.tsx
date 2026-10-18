// Password input with show/hide toggle (design: components/forms/PasswordField.jsx).
// TODO: PasswordChecklist for new passwords (register, change password).
import { forwardRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff } from "lucide-react";
import { TextField, type TextFieldProps } from "@/components/forms/TextField";

export const PasswordField = forwardRef<HTMLInputElement, Omit<TextFieldProps, "type" | "trailing">>((props, ref) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      ref={ref}
      type={visible ? "text" : "password"}
      autoComplete="current-password"
      spellCheck={false}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={t(visible ? "pw.hide" : "pw.show")}
          aria-pressed={visible}
          className="inline-flex h-9 w-10 items-center justify-center rounded-sm text-muted-foreground hover:bg-muted hover:text-foreground [&_svg]:size-[18px]"
        >
          {visible ? <EyeOff /> : <Eye />}
        </button>
      }
      {...props}
    />
  );
});
PasswordField.displayName = "PasswordField";

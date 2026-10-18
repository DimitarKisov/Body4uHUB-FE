// Toast API for screens: graphite card, tone icon, 5s. Rendered by <Toaster /> (sonner).
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Toast, type ToastTone } from "@/components/feedback/Toaster";

function show(tone: ToastTone, title: ReactNode, text?: ReactNode) {
  toast.custom((id) => <Toast tone={tone} title={title} text={text} onClose={() => toast.dismiss(id)} />, { duration: 5000 });
}

export const notify = {
  success: (title: ReactNode, text?: ReactNode) => show("success", title, text),
  error: (title: ReactNode, text?: ReactNode) => show("error", title, text),
  info: (title: ReactNode, text?: ReactNode) => show("info", title, text),
};

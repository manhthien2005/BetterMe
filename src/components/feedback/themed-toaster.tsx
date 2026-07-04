"use client";

import { toast, Toaster } from "sonner";

export type ToastIntent = "success" | "info" | "warning" | "error";

export function notify(intent: ToastIntent, message: string): void {
  if (intent === "success") toast.success(message);
  else if (intent === "warning") toast.warning(message);
  else if (intent === "error") toast.error(message, { duration: Infinity });
  else toast.info(message);
}

export function ThemedToaster() {
  return <div data-testid="themed-toaster" data-theme-aware="true" aria-live="polite"><Toaster closeButton position="top-right" toastOptions={{ style: { background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)", borderRadius: "var(--radius-control)", boxShadow: "var(--card-shadow)" } }} /></div>;
}

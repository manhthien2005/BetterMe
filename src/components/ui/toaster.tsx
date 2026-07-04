"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "rounded-lg border border-slate-200 bg-white/95 text-slate-900 shadow-note backdrop-blur-xl",
          title: "font-semibold",
          description: "text-slate-500"
        }
      }}
    />
  );
}

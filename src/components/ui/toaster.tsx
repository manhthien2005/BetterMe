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
            "rounded-lg border border-wafer bg-mochi/95 text-plum shadow-mochi backdrop-blur-xl",
          title: "font-semibold",
          description: "text-mauve"
        }
      }}
    />
  );
}

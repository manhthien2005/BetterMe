import type { Metadata, Viewport } from "next";

import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/query-provider";

export const metadata: Metadata = {
  title: "BetterMe",
  description: "Habit tracker hiện đại cho một tuần tốt hơn.",
  applicationName: "BetterMe",
  manifest: "/manifest.json"
};

export const viewport: Viewport = {
  themeColor: "#f8f5ea",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi">
      <body className="note-grid min-h-screen">
        <QueryProvider>
          <TooltipProvider delayDuration={160}>
            {children}
            <Toaster />
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

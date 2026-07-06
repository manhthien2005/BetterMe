import type { Metadata, Viewport } from "next";
import { Baloo_2, Nunito } from "next/font/google";

import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/query-provider";

const displayFont = Baloo_2({
  subsets: ["latin", "vietnamese"],
  variable: "--font-display"
});

const bodyFont = Nunito({
  subsets: ["latin", "vietnamese"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "BetterMe",
  description: "Habit tracker hiện đại cho một tuần tốt hơn.",
  applicationName: "BetterMe",
  manifest: "/manifest.json"
};

export const viewport: Viewport = {
  themeColor: "#fdf5f1",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={`${displayFont.variable} ${bodyFont.variable}`} lang="vi">
      <body className="meadow min-h-screen">
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

import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Bricolage_Grotesque } from "next/font/google";

import "@/app/globals.css";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/components/query-provider";

// Variable font — the wght axis alone is what the design uses.
const displayFont = Bricolage_Grotesque({
  subsets: ["latin", "vietnamese"],
  variable: "--font-display"
});

// Static font — the weights must be listed explicitly.
const bodyFont = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "BetterMe",
  description: "Habit tracker hiện đại cho một tuần tốt hơn.",
  applicationName: "BetterMe",
  manifest: "/manifest.json"
};

export const viewport: Viewport = {
  themeColor: "#FEFBF3",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className={`${displayFont.variable} ${bodyFont.variable}`} lang="vi">
      <body className="min-h-screen">
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

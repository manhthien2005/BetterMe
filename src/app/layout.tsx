import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "@/app/globals.css";
import { AppShell } from "../components/layout/app-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"]
});

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
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} note-grid min-h-screen`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

"use client";

import type { ReactNode } from "react";

import { ThemedToaster } from "../feedback/themed-toaster";
import { ThemeProvider } from "../theme/theme-provider";
import { ThemeSwitcher } from "../theme/theme-switcher";
import { useTracker } from "../../hooks/use-tracker";
import { TrackerStoreProvider } from "../../store/tracker-store";
import { AppNavigation } from "./app-navigation";

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <TrackerStoreProvider>
      <ThemeBridge>{children}</ThemeBridge>
    </TrackerStoreProvider>
  );
}

function ThemeBridge({ children }: AppShellProps) {
  const tracker = useTracker();
  const themeId = tracker.state.data?.settings.themeId ?? "cute-cat";

  return (
    <ThemeProvider themeId={themeId} onThemeChange={(nextThemeId) => tracker.updateSettings({ themeId: nextThemeId })}>
      <div className="app-shell">
        <header className="app-shell__header">
          <a className="app-shell__brand" href="/dashboard">BetterMe</a>
          <ThemeSwitcher />
        </header>
        <AppNavigation />
        <main className="app-shell__main">{children}</main>
        <ThemedToaster />
      </div>
    </ThemeProvider>
  );
}

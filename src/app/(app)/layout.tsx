import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { StateProvider } from "@/components/app/state-provider";
import { ensureUserBootstrap } from "@/lib/server/actions";
import { isDevAuthBypassEnabled } from "@/lib/dev-auth";
import { createClient } from "@/lib/supabase/server";

/** Auth gate + the frame for all four spaces (spec §3). */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const devAuthBypassEnabled = isDevAuthBypassEnabled();
  const supabase = await createClient();
  let user = null;
  let error = null;

  // Supabase unreachable must degrade to "no session", never a crashed page —
  // the app itself runs from localStorage.
  try {
    ({
      data: { user },
      error
    } = await supabase.auth.getUser());
  } catch {
    user = null;
  }

  if (error || !user) {
    if (devAuthBypassEnabled) {
      return (
        <StateProvider userEmail="dev@betterme.local">
          <AppShell>{children}</AppShell>
        </StateProvider>
      );
    }

    redirect("/login");
    return null;
  }

  await ensureUserBootstrap();

  return (
    <StateProvider userEmail={user.email ?? "BetterMe"}>
      <AppShell>{children}</AppShell>
    </StateProvider>
  );
}

import { redirect } from "next/navigation";

import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { ensureUserBootstrap } from "@/lib/server/actions";
import { isDevAuthBypassEnabled } from "@/lib/dev-auth";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const devAuthBypassEnabled = isDevAuthBypassEnabled();
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error || !user) {
    if (devAuthBypassEnabled) {
      return <DashboardClient userEmail="dev@betterme.local" />;
    }

    redirect("/login");
    return null;
  }

  await ensureUserBootstrap();

  return <DashboardClient userEmail={user.email ?? "BetterMe"} />;
}

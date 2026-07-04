import { redirect } from "next/navigation";

import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { ensureUserBootstrap, getTrackerSnapshot } from "@/lib/server/actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await ensureUserBootstrap();
  const snapshot = await getTrackerSnapshot();

  return <DashboardClient initialSnapshot={snapshot} userEmail={user.email || "BetterMe"} />;
}

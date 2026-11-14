import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WorldClientShell } from "@/components/world/world-client-shell";
import { isDevAuthBypassEnabled } from "@/lib/dev-auth";
import { ensureUserBootstrap } from "@/lib/server/actions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Reading Quest 3D · BetterMe"
};

async function resolveWorldPageBootstrap(): Promise<
  | {
      kind: "redirect";
    }
  | {
      kind: "ready";
      authenticatedUser: {
        userId: string;
        email: string;
      };
      initialNowMs: number;
    }
> {
  const devAuthBypassEnabled = isDevAuthBypassEnabled();
  let user = null;
  let error = null;

  try {
    const supabase = await createClient();
    ({
      data: { user },
      error
    } = await supabase.auth.getUser());
  } catch {
    user = null;
  }

  if (error || !user) {
    if (devAuthBypassEnabled) {
      return {
        kind: "ready",
        authenticatedUser: {
          userId: "dev-local-owner",
          email: "dev@betterme.local"
        },
        initialNowMs: Date.now()
      };
    }

    return {
      kind: "redirect"
    };
  }

  await ensureUserBootstrap();

  return {
    kind: "ready",
    authenticatedUser: {
      userId: user.id,
      email: user.email ?? "BetterMe"
    },
    initialNowMs: Date.now()
  };
}

/**
 * Authenticated 3D World route (`/world`).
 * Mirrors `(app)/layout.tsx` auth gating without mounting BetterMe's
 * `StateProvider`, keeping frame-by-frame 3D state strictly isolated.
 * Owner identity is derived strictly from the server-authenticated Supabase user.
 */
export default async function WorldPage({ searchParams }: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
} = {}) {
  const bootstrap = await resolveWorldPageBootstrap();

  if (bootstrap.kind === "redirect") {
    redirect("/login");
    return null;
  }

  const plazaStudy = (await searchParams)?.plaza === "study";

  return (
    <WorldClientShell
      key={plazaStudy ? "plaza-study" : "world"}
      authenticatedUser={bootstrap.authenticatedUser}
      initialNowMs={bootstrap.initialNowMs}
      plazaStudy={plazaStudy}
    />
  );
}

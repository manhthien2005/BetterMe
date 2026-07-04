import { NextResponse, type NextRequest } from "next/server";

import { ensureUserBootstrap } from "@/lib/server/actions";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    await ensureUserBootstrap();
  }

  return NextResponse.redirect(new URL(next, request.url));
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { LOCALE_COOKIE_NAME, getLocaleFromPathname, resolveLocale, withLocaleInPathname } from "./i18n/locale";
import type { Database } from "@/lib/types";

const LEGACY_LOCALIZED_PATHS = new Set(["dashboard", "tracker", "calendar", "habits", "settings"]);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const pathnameLocale = getLocaleFromPathname(pathname);

  if (!pathnameLocale && shouldRedirectToLocale(pathname)) {
    const locale = resolveLocale([
      request.cookies.get(LOCALE_COOKIE_NAME)?.value,
      ...parseAcceptLanguage(request.headers.get("accept-language"))
    ]);
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? `/${locale}/dashboard` : withLocaleInPathname(pathname, locale);
    const redirect = NextResponse.redirect(url);
    redirect.cookies.set(LOCALE_COOKIE_NAME, locale, { path: "/", maxAge: 31_536_000, sameSite: "lax" });
    return redirect;
  }

  let response = NextResponse.next({
    request
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    if (pathnameLocale) response.cookies.set(LOCALE_COOKIE_NAME, pathnameLocale, { path: "/", maxAge: 31_536_000, sameSite: "lax" });
    return response;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      }
    }
  });

  await supabase.auth.getUser();

  if (pathnameLocale) response.cookies.set(LOCALE_COOKIE_NAME, pathnameLocale, { path: "/", maxAge: 31_536_000, sameSite: "lax" });

  return response;
}

function shouldRedirectToLocale(pathname: string) {
  if (pathname === "/") return true;
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return LEGACY_LOCALIZED_PATHS.has(firstSegment ?? "");
}

function parseAcceptLanguage(header: string | null): string[] {
  if (!header) return [];
  return header
    .split(",")
    .map((part) => {
      const [language, quality = "q=1"] = part.trim().split(";");
      const q = Number(quality.replace("q=", ""));
      return { language, q: Number.isFinite(q) ? q : 1 };
    })
    .filter((entry) => entry.language)
    .sort((left, right) => right.q - left.q)
    .map((entry) => entry.language);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};

# Dev Auth Bypass Design

## Goal

Allow local development to enter BetterMe without sending Supabase magic links, avoiding OTP rate limits while preserving production auth behavior.

## Approved Direction

Add a dev-only bypass controlled by an environment flag. This is preferred over switching the login flow to email/password because email/password requires Supabase Auth configuration, password UX, and extra policy handling, while the immediate need is only to inspect the local dashboard.

## Behavior

- Add `BETTERME_DEV_AUTH_BYPASS=true` as the local flag.
- The bypass is active only when `process.env.NODE_ENV !== "production"` and the flag equals `true`.
- When active, `/login` still renders the normal magic-link form and also shows a `Continue as dev` action.
- The dev action navigates to `/dashboard`.
- `/dashboard` renders with `dev@betterme.local` when the bypass is active and no Supabase user exists.
- `/dashboard` must not call `ensureUserBootstrap()` in bypass mode because that server action requires a real Supabase user.
- When the bypass is inactive, current Supabase auth behavior stays unchanged.
- Production must ignore the bypass flag even if it is set.

## Files

- `src/lib/dev-auth.ts`: small helper for the environment gate.
- `src/app/login/page.tsx`: passes bypass state to the login form.
- `src/components/auth/login-form.tsx`: renders the dev action when enabled.
- `src/app/dashboard/page.tsx`: allows dev dashboard rendering when enabled.
- Route tests cover enabled, disabled, and production-blocked behavior.

## Verification

- `pnpm run test -- src/app/login/page.test.tsx src/app/dashboard/page.test.tsx`
- `pnpm run typecheck`

## Out Of Scope

- Email/password auth.
- Supabase Auth settings changes.
- Persisting dev data to Supabase.
- Any production bypass.

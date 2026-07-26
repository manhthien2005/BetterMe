"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Email + password auth — replaces the magic-link flow (which hit email rate
 * limits easily). Login needs NO OTP; signup emails a 6-digit OTP that
 * verifySignupOtp confirms. These run SERVER-side so @supabase/ssr writes the
 * session cookies (allowed inside server actions); the dashboard page bootstraps
 * the profile + default habits on its next render. On success they redirect to
 * /dashboard; on failure they return { ok: false, reason } (never throw a raw
 * error to the client).
 *
 * Supabase project config required (dashboard/Management API, NOT in Postgres —
 * see docs/auth-email-config.md for the exact reproducible settings):
 * - Auth > Providers > Email: enabled, "Confirm email" ON (mailer_autoconfirm=false).
 * - "Confirm signup" template: OTP-only via {{ .Token }} (no {{ .ConfirmationURL }},
 *   which avoids email-link prefetch consuming the token before the user verifies).
 * - mailer_otp_length (6) MUST match the login form's OTP input length. A larger
 *   value is silently truncated client-side and every verify fails as otp_expired.
 * With "Confirm email" OFF, signUp signs the user in immediately and these
 * actions skip the OTP step gracefully.
 */

export type AuthResult = { ok: true } | { ok: false; reason: string };

function normalizeEmail(raw: string): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

/** Log in with email + password. No OTP. Redirects to /dashboard on success. */
export async function loginWithPassword(email: string, password: string): Promise<AuthResult> {
  const normalized = normalizeEmail(email);

  if (normalized === "" || typeof password !== "string" || password === "") {
    return { ok: false, reason: "missing-credentials" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email: normalized, password });

  if (error) return { ok: false, reason: error.message };

  redirect("/dashboard");
}

/**
 * Start signup with email + password. Sends a confirmation OTP (or signs in
 * immediately if the project has "Confirm email" off). Returns { ok: true }
 * when an OTP is pending (client moves to the verify step).
 */
export async function signUpWithPassword(email: string, password: string): Promise<AuthResult> {
  const normalized = normalizeEmail(email);

  if (normalized === "") return { ok: false, reason: "missing-email" };
  // Supabase's default minimum is 6 — guard locally for a friendlier message.
  if (typeof password !== "string" || password.length < 6) {
    return { ok: false, reason: "weak-password" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email: normalized, password });

  if (error) return { ok: false, reason: error.message };

  // "Confirm email" is off on the project: already signed in, no OTP step.
  if (data.session) redirect("/dashboard");

  // Supabase anti-enumeration: signing up an already-registered (confirmed)
  // email succeeds but returns a user with an empty identities array and no
  // session — no OTP is sent. Detect it so the client routes to login instead
  // of stranding the person on the verify screen waiting for a code.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    return { ok: false, reason: "already-registered" };
  }

  return { ok: true };
}

/** Verify the 6-digit signup OTP. Redirects to /dashboard on success. */
export async function verifySignupOtp(email: string, token: string): Promise<AuthResult> {
  const normalized = normalizeEmail(email);
  const code = typeof token === "string" ? token.trim() : "";

  if (normalized === "" || code === "") return { ok: false, reason: "missing-code" };

  const supabase = await createClient();

  // The signup confirmation OTP verifies with type "email" (proven end-to-end
  // against this project's GoTrue via admin generate_link + /verify). The code
  // length is the project's mailer_otp_length (6) — the login form MUST accept
  // at least that many digits, or it silently submits a truncated, invalid code
  // and every attempt fails as otp_expired. See docs/auth-email-config.md.
  const { error } = await supabase.auth.verifyOtp({
    email: normalized,
    token: code,
    type: "email"
  });

  if (error) return { ok: false, reason: error.message };

  redirect("/dashboard");
}

/** Re-send the signup confirmation OTP (email rate limits still apply). */
export async function resendSignupOtp(email: string): Promise<AuthResult> {
  const normalized = normalizeEmail(email);

  if (normalized === "") return { ok: false, reason: "missing-email" };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({ type: "signup", email: normalized });

  if (error) return { ok: false, reason: error.message };

  return { ok: true };
}

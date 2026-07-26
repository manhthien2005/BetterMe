# Auth email config (email + password with signup OTP)

> This config lives in the **Supabase project (GoTrue), not in Postgres** — so it is
> NOT captured by `supabase/schema.sql` or migrations. Treat this doc as the source of
> truth and re-apply it in any new environment. Related code: `src/lib/server/auth-actions.ts`,
> `src/components/auth/login-form.tsx`.

## Flow
- **Login**: email + password (`signInWithPassword`). No OTP.
- **Signup**: email + password (`signUp`) → a **6-digit OTP** is emailed → the client
  verifies it with `verifyOtp({ email, token, type: "email" })` → session → `/dashboard`.
- Magic links are intentionally removed (they hit the built-in SMTP rate limit).

## Root cause we fixed (read before touching OTP length)
Signup kept failing with `otp_expired` ("Token has expired or is invalid") even for a
fresh code. The token in `auth.users` was present and **unconsumed**, the user unconfirmed,
and **both** `verifyOtp` types failed — which ruled out prefetch and the verify type.

The real cause: **`mailer_otp_length` was `8`** but the login form hard-capped the OTP
input at 6 digits (`maxLength={6}`, `.slice(0, 6)`). The client **silently truncated** the
real 8-digit code to 6, so GoTrue always received a wrong code. Proven with a controlled
E2E test (admin `generate_link` returns `email_otp`; `POST /auth/v1/verify` succeeded with
the full-length code for both `type: "email"` and `type: "signup"`).

**Invariant:** `mailer_otp_length` **must** be ≤ the login form's OTP input cap. The form
now accepts up to 8 digits as headroom, and the OTP length is pinned to **6**. If you change
`mailer_otp_length`, update the form (`src/components/auth/login-form.tsx`) to match.

## Required settings
| Setting | Value | Why |
| --- | --- | --- |
| `external_email_enabled` | `true` | email provider on |
| `mailer_autoconfirm` | `false` | "Confirm email" ON — OTP step required |
| `mailer_otp_length` | `6` | must match the form's OTP input |
| `mailer_otp_exp` | `3600` | 1h — delivery latency never expires a valid code |
| `mailer_subjects_confirmation` | `Xác nhận email cho BetterMe 🌱` | branded VN subject |
| `mailer_templates_confirmation_content` | OTP-only, contains `{{ .Token }}`, **no** `{{ .ConfirmationURL }}` | a link can be prefetched by mail scanners and consume the token before the user verifies |
| Custom SMTP | Gmail (`smtp.gmail.com`, sender `bebetterwithus2026@gmail.com`) | escapes the built-in 2/hour rate limit; required to edit templates |

## Reproduce (Management API)
Requires a Supabase **personal access token** (`sbp_...`) in `$env:SUPABASE_ACCESS_TOKEN`.
Never commit it. (`.kiro/` is gitignored; do not move the token into tracked files.)

```powershell
$ref = "izufjekubmnltlqtjgqs"
$content = @'
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#4a3f55;">
  <h1 style="font-size:20px;color:#6b4e7a;margin:0 0 8px;">Chào mừng đến BetterMe 🌱</h1>
  <p style="font-size:15px;line-height:1.6;margin:0 0 20px;">Nhập mã 6 số dưới đây vào ứng dụng để xác nhận email và bắt đầu chăm khu vườn của bạn nha.</p>
  <div style="font-size:34px;font-weight:700;letter-spacing:8px;text-align:center;color:#3f7a5a;background:#eef6f0;border-radius:14px;padding:18px 0;margin:0 0 20px;">{{ .Token }}</div>
  <p style="font-size:13px;line-height:1.6;color:#8a7d95;margin:0;">Mã có hiệu lực khoảng 60 phút. Nếu bạn không tạo tài khoản BetterMe, cứ bỏ qua email này nhé — không có gì thay đổi cả.</p>
</div>
'@
$body = @{
  mailer_autoconfirm = $false
  mailer_otp_length = 6
  mailer_otp_exp = 3600
  mailer_subjects_confirmation = "Xác nhận email cho BetterMe 🌱"
  mailer_templates_confirmation_content = $content
} | ConvertTo-Json -Depth 5
$bytes = [System.Text.Encoding]::UTF8.GetBytes($body)  # UTF-8 so VN text/emoji survive
Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ref/config/auth" `
  -Method Patch -Headers @{ Authorization = "Bearer $env:SUPABASE_ACCESS_TOKEN" } `
  -Body $bytes -ContentType "application/json; charset=utf-8"
```
GoTrue reloads config **asynchronously** (~10s) — a just-changed OTP length is not instant.

## E2E smoke test (no real inbox needed)
Uses the `service_role` key (fetch via `GET /v1/projects/$ref/api-keys?reveal=true`) to mint
a real signup OTP and verify it. Deletes the throwaway user afterwards.

```powershell
# $svc = service_role key; $base = "https://$ref.supabase.co"
$email = "e2e-$([guid]::NewGuid().ToString('N').Substring(0,8))@example.com"
$h = @{ apikey=$svc; Authorization="Bearer $svc"; "Content-Type"="application/json" }
$gen = Invoke-RestMethod "$base/auth/v1/admin/generate_link" -Method Post -Headers $h `
  -Body (@{ type="signup"; email=$email; password="TestPassw0rd!123" } | ConvertTo-Json)
# NOTE: email_otp + id are TOP-LEVEL on the response (not under .properties)
$v = Invoke-RestMethod "$base/auth/v1/verify" -Method Post `
  -Headers @{ apikey=$svc; "Content-Type"="application/json" } `
  -Body (@{ email=$email; token=$gen.email_otp; type="email" } | ConvertTo-Json)
Invoke-RestMethod "$base/auth/v1/admin/users/$($gen.id)" -Method Delete -Headers $h  # cleanup
# expect: $gen.email_otp.Length -eq 6 and $v.access_token present
```

## Security follow-ups
- The Management API token was found **plaintext** in `.kiro/settings/mcp.json`. `.kiro/` is
  gitignored (never committed), so it is not in the repo — but consider rotating it in the
  Supabase dashboard if it has been shared, and prefer an env var.
- Enable **Leaked Password Protection** (Auth advisor WARN) now that password auth is live.

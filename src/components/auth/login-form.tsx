"use client";

import Link from "next/link";
import { KeyRound, LogIn, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  loginWithPassword,
  resendSignupOtp,
  signUpWithPassword,
  verifySignupOtp
} from "@/lib/server/auth-actions";

type Mode = "login" | "signup" | "verify";

/** Cozy Vietnamese copy for the auth reasons — anti-enumeration on the login path. */
function describeReason(reason: string): string {
  const r = reason || "";

  // Supabase phrases these a few different ways — match before the exact cases.
  if (/rate limit|only request this after|too many/i.test(r)) {
    return "Gửi mã hơi nhiều rồi — chờ chút rồi thử lại nha ☁️";
  }
  if (/expired or is invalid|otp_expired/i.test(r)) {
    return "Mã đã hết hạn hoặc chưa đúng — bấm “Gửi lại mã” để lấy mã mới nha ☁️";
  }

  switch (r) {
    case "missing-credentials":
      return "Nhập email và mật khẩu nha.";
    case "missing-email":
      return "Nhập email trước nha.";
    case "missing-code":
      return "Nhập mã 6 số trong email nha.";
    case "weak-password":
      return "Mật khẩu cần ít nhất 6 ký tự.";
    case "already-registered":
      return "Email này đã có tài khoản rồi — Sếp đăng nhập nha.";
    case "Invalid login credentials":
      return "Email hoặc mật khẩu chưa đúng.";
    case "Email not confirmed":
      return "Email chưa xác nhận — Sếp kiểm tra hộp thư lấy mã 6 số nha.";
    default:
      return r || "Có gì đó chưa ổn — thử lại sau chút nha ☁️";
  }
}

export function LoginForm({ devAuthBypassEnabled = false }: { devAuthBypassEnabled?: boolean }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Count the resend cooldown down to zero, one second at a time.
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function runLogin() {
    startTransition(async () => {
      setNote(null);
      const result = await loginWithPassword(email, password);
      // On success the server action redirects; only a failure returns here.
      if (result && !result.ok) setNote(describeReason(result.reason));
    });
  }

  function runSignup() {
    const target = email.trim().toLowerCase();

    // Idempotent: a code was already sent to this address and the cooldown is
    // still running — don't fire another signup email, just return to verify.
    if (target !== "" && target === otpSentTo && cooldown > 0) {
      setMode("verify");
      setNote(`Đã gửi mã tới ${target} rồi — kiểm tra email nha (gửi lại được sau ${cooldown}s).`);
      return;
    }

    startTransition(async () => {
      setNote(null);
      const result = await signUpWithPassword(email, password);
      if (!result) return; // "Confirm email" off -> already redirected
      if (result.ok) {
        setOtp("");
        setOtpSentTo(target);
        setMode("verify");
        setCooldown(30);
        setNote(`Đã gửi mã 6 số tới ${target} — mở email để hoàn tất nha.`);
      } else if (result.reason === "already-registered") {
        setMode("login");
        setNote(describeReason(result.reason));
      } else {
        setNote(describeReason(result.reason));
      }
    });
  }

  function runVerify() {
    startTransition(async () => {
      setNote(null);
      const result = await verifySignupOtp(email, otp);
      if (result && !result.ok) setNote(describeReason(result.reason));
    });
  }

  function runResend() {
    if (cooldown > 0) return; // guard — the button is also disabled meanwhile
    startTransition(async () => {
      const result = await resendSignupOtp(email);
      if (result.ok) {
        setOtpSentTo(email.trim().toLowerCase());
        setCooldown(30);
        setNote("Đã gửi lại mã — chờ email chút nha ☁️");
      } else {
        setNote(describeReason(result.reason));
      }
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isPending) return;

    if (mode === "login") runLogin();
    else if (mode === "signup") runSignup();
    else runVerify();
  }

  const heading =
    mode === "login" ? "Vào BetterMe" : mode === "signup" ? "Tạo tài khoản" : "Xác nhận email";

  return (
    <form className="w-full space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-matcha/20 text-matcha-deep">
          {mode === "verify" ? (
            <ShieldCheck className="h-5 w-5" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
        </div>
        <h2 className="font-display text-2xl font-bold text-plum">{heading}</h2>
        <p className="max-w-sm text-sm font-semibold leading-6 text-mauve">
          {mode === "login"
            ? "Đăng nhập bằng email và mật khẩu. Dữ liệu của bạn vẫn được tách riêng theo tài khoản."
            : mode === "signup"
              ? "Tạo tài khoản bằng email và mật khẩu — bọn mình gửi mã 6 số để xác nhận email."
              : `Nhập mã 6 số vừa gửi tới ${email.trim().toLowerCase() || "email của bạn"}.`}
        </p>
      </div>

      {mode !== "verify" ? (
        <>
          <label className="grid gap-2 text-sm font-bold text-plum">
            Email
            <Input
              autoComplete="email"
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-plum">
            Mật khẩu
            <Input
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={mode === "signup" ? 6 : undefined}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === "signup" ? "Ít nhất 6 ký tự" : "Mật khẩu của bạn"}
              required
              type="password"
              value={password}
            />
          </label>
        </>
      ) : (
        <label className="grid gap-2 text-sm font-bold text-plum">
          Mã xác nhận
          <Input
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={8}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 8))}
            placeholder="6 số"
            required
            value={otp}
          />
        </label>
      )}

      {note ? (
        <p className="text-sm font-semibold leading-5 text-mauve" role="status">
          {note}
        </p>
      ) : null}

      <Button className="w-full" disabled={isPending}>
        {mode === "login" ? (
          <>
            <LogIn className="h-4 w-4" />
            {isPending ? "Đang vào..." : "Đăng nhập"}
          </>
        ) : mode === "signup" ? (
          <>
            <Mail className="h-4 w-4" />
            {isPending ? "Đang gửi mã..." : "Đăng ký"}
          </>
        ) : (
          <>
            <KeyRound className="h-4 w-4" />
            {isPending ? "Đang xác nhận..." : "Xác nhận"}
          </>
        )}
      </Button>

      {mode === "login" ? (
        <p className="text-sm font-semibold text-mauve">
          Chưa có tài khoản?{" "}
          <button
            className="font-bold text-matcha-deep underline underline-offset-4 transition hover:text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
            onClick={() => {
              setMode("signup");
              setNote(null);
            }}
            type="button"
          >
            Đăng ký
          </button>
        </p>
      ) : mode === "signup" ? (
        <p className="text-sm font-semibold text-mauve">
          Đã có tài khoản?{" "}
          <button
            className="font-bold text-matcha-deep underline underline-offset-4 transition hover:text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
            onClick={() => {
              setMode("login");
              setNote(null);
            }}
            type="button"
          >
            Đăng nhập
          </button>
        </p>
      ) : (
        <div className="flex items-center justify-between gap-2 text-sm font-semibold text-mauve">
          <button
            className="font-bold text-matcha-deep underline underline-offset-4 transition hover:text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep disabled:cursor-not-allowed disabled:text-mauve/50 disabled:no-underline"
            disabled={isPending || cooldown > 0}
            onClick={() => runResend()}
            type="button"
          >
            {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : "Gửi lại mã"}
          </button>
          <button
            className="transition hover:text-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-matcha-deep"
            onClick={() => {
              setMode("signup");
              setNote(null);
            }}
            type="button"
          >
            Đổi email
          </button>
        </div>
      )}

      {devAuthBypassEnabled ? (
        <Button asChild className="w-full" type="button" variant="outline">
          <Link href="/dashboard">Continue as dev</Link>
        </Button>
      ) : null}
    </form>
  );
}

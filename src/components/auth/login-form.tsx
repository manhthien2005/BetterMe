"use client";

import Link from "next/link";
import { Mail, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ devAuthBypassEnabled = false }: { devAuthBypassEnabled?: boolean }) {
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        const supabase = createClient();
        const redirectTo = `${window.location.origin}/auth/callback`;
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectTo
          }
        });

        if (error) {
          throw error;
        }

        toast.success("Magic link đã được gửi", {
          description: "Mở email của bạn để vào BetterMe."
        });
      } catch (error) {
        toast.error("Chưa gửi được magic link", {
          description: error instanceof Error ? error.message : "Kiểm tra Supabase env và email."
        });
      }
    });
  }

  return (
    <form className="w-full space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-teal-700">
          <Sparkles className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-bold tracking-normal text-slate-950">Vào BetterMe</h2>
        <p className="max-w-sm text-sm leading-6 text-muted-foreground">
          Nhập email để nhận magic link. Không cần mật khẩu, dữ liệu của bạn vẫn được tách
          riêng theo tài khoản.
        </p>
      </div>
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
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
      <Button className="w-full" disabled={isPending}>
        <Mail className="h-4 w-4" />
        {isPending ? "Đang gửi..." : "Gửi magic link"}
      </Button>
      {devAuthBypassEnabled ? (
        <Button asChild className="w-full" type="button" variant="outline">
          <Link href="/dashboard">Continue as dev</Link>
        </Button>
      ) : null}
      <p className="text-xs leading-5 text-muted-foreground">
        Khi deploy Vercel, nhớ thêm URL production vào Supabase Auth redirect URLs.
      </p>
    </form>
  );
}

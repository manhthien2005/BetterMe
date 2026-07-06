import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { isDevAuthBypassEnabled } from "@/lib/dev-auth";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const devAuthBypassEnabled = isDevAuthBypassEnabled();
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="soft-panel grid w-full max-w-5xl overflow-hidden rounded-lg md:grid-cols-[1.05fr_0.95fr]">
        <div className="relative min-h-[420px] bg-gradient-to-br from-teal-600 via-sky-600 to-rose-500 p-7 text-white sm:p-10">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] bg-[size:28px_28px] opacity-55" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/78">
                Weekly Tracker
              </p>
              <h1 className="mt-4 max-w-md text-4xl font-bold tracking-normal sm:text-5xl">
                BetterMe
              </h1>
              <p className="mt-5 max-w-md text-base leading-7 text-white/84">
                Một bảng note nhỏ xinh để tick thói quen, xem streak và giữ nhịp học tập
                mỗi ngày.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-white/88">
              <div className="rounded-lg border border-white/25 bg-white/12 p-4 backdrop-blur">
                30 ngày tiến bộ, chart mượt, toast nhẹ và dữ liệu riêng tư bằng Supabase.
              </div>
              <div className="rounded-lg border border-white/25 bg-white/12 p-4 backdrop-blur">
                Giao diện tối ưu cho Vercel, mobile và những buổi review cuối ngày.
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center p-6 sm:p-10">
          <LoginForm devAuthBypassEnabled={devAuthBypassEnabled} />
        </div>
      </section>
    </main>
  );
}

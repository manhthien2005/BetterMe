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
        <div className="relative min-h-[420px] bg-gradient-to-br from-sakura/45 via-rice to-matcha/25 p-7 sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(rgba(74,61,70,0.06)_1px,transparent_1.4px)] bg-[size:24px_24px]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-matcha-deep">
                Habit garden
              </p>
              <h1 className="mt-4 max-w-md font-display text-4xl font-bold text-plum sm:text-5xl">
                BetterMe
              </h1>
              <p className="mt-5 max-w-md text-base font-semibold leading-7 text-mauve">
                Một khu vườn nhỏ để tick thói quen mỗi ngày. Nếp — bạn cùng phòng bằng
                xôi nếp — sẽ lớn lên cùng nhịp 7 ngày của bạn.
              </p>
            </div>
            <div className="grid gap-3 text-sm font-semibold text-plum">
              <div className="rounded-2xl border border-wafer bg-white/75 p-4 shadow-mochi">
                🌱 Không có streak đổ vỡ — chỉ có nhịp 7 ngày dịu dàng và những lần bắt
                đầu lại nhẹ nhàng.
              </div>
              <div className="rounded-2xl border border-wafer bg-white/75 p-4 shadow-mochi">
                🌸 Tick đủ thói quen, mầm cây trên đầu Nếp nở hoa. Dữ liệu riêng tư theo
                tài khoản Supabase.
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

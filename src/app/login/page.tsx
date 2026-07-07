import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { Nep } from "@/components/dashboard/nep";
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
                Một khu vườn nhỏ để tick thói quen mỗi ngày. Nhận nuôi một bé cún hoặc
                mèo — bé sẽ lớn lên, quấn bạn hơn theo từng thói quen bạn hoàn thành.
              </p>
            </div>
            <div className="flex items-end justify-between gap-4">
              <div className="grid flex-1 gap-3 text-sm font-semibold text-plum">
                <div className="rounded-2xl border border-wafer bg-white/75 p-4 shadow-mochi">
                  🌱 Không có streak đổ vỡ — lỡ nhịp mấy hôm, bé cưng vẫn để dành quà
                  đợi bạn về.
                </div>
                <div className="rounded-2xl border border-wafer bg-white/75 p-4 shadow-mochi">
                  🦴 Hoàn thành thói quen để kiếm bánh thưởng, nuôi bé từ sơ sinh tới
                  trưởng thành. Dữ liệu riêng tư theo tài khoản Supabase.
                </div>
              </div>
              <div className="hidden shrink-0 md:block">
                <Nep
                  completedCount={2}
                  message="Tớ là Nếp, người giữ vườn! Vào chọn trứng nha 🌱"
                  totalCount={7}
                />
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

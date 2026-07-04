import type { LucideIcon } from "lucide-react";

export function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
  tone = "teal"
}: {
  title: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: "teal" | "sky" | "rose" | "amber";
}) {
  const toneClass = {
    teal: "from-teal-500/14 to-emerald-400/10 text-teal-700",
    sky: "from-sky-500/14 to-cyan-400/10 text-sky-700",
    rose: "from-rose-500/14 to-orange-400/10 text-rose-700",
    amber: "from-amber-400/18 to-lime-400/10 text-amber-700"
  }[tone];

  return (
    <div className="soft-panel rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {title}
          </p>
          <p className="mt-2 text-2xl font-black tracking-normal text-slate-950">{value}</p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${toneClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{helper}</p>
    </div>
  );
}

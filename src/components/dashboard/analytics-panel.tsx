import { Award, BarChart3, CheckCircle2, Flower2, Minus, Sprout, TrendingDown, TrendingUp } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import type { DashboardStatus, DashboardViewModel } from "@/components/dashboard/dashboard-data";
import { cn, clamp, formatPercent } from "@/lib/utils";

const GAUGE_RADIUS = 54;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

/**
 * Analytics — a wide Bento section that turns four loose numbers into one
 * cohesive story: a ring gauge for average completion, an area trend for the
 * last stretch of days, per-habit performance bars, and two gentle insights.
 * It never duplicates the hero's streak metrics, and framing stays no-guilt:
 * a dip is stated neutrally ("vs previous period"), and the habit that needs
 * love is framed as care, never as failure (invariant 1).
 */
export function AnalyticsPanel({ viewModel }: { viewModel: DashboardViewModel }) {
  const analytics = viewModel.analytics;
  const average = clamp(analytics.averageCompletionRate, 0, 1);
  const averagePercent = Math.round(average * 100);
  const delta = analytics.changeFromPreviousPeriod;

  return (
    <section className="soft-panel card-lift rounded-lg p-4 sm:p-5 xl:[grid-area:3/1/4/19]">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-dawn/20">
          <BarChart3 className="h-5 w-5 text-dawn-deep" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold text-plum">Phân tích</h2>
          <p className="text-sm font-semibold text-mauve">Nhìn nhanh nhịp của mình</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(200px,0.85fr)_minmax(0,1.6fr)]">
        {/* Ring gauge + supporting counts */}
        <div className="flex flex-col gap-3 rounded-2xl border border-wafer bg-white/75 p-4">
          <div className="flex items-center gap-4">
            <GaugeRing percent={averagePercent} value={average} />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-mauve">
                Hoàn thành trung bình
              </p>
              <DeltaPill delta={delta} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <MiniStat icon={Flower2} label="Ngày tốt" tone="matcha" value={`${analytics.goodDays}`} />
            <MiniStat
              icon={CheckCircle2}
              label="Lượt hoàn thành"
              tone="dawn"
              value={`${analytics.totalCompletedHabits}`}
            />
          </div>
        </div>

        {/* Completion trend */}
        <div className="rounded-2xl border border-wafer bg-white/75 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-wide text-mauve">
              Xu hướng hoàn thành
            </p>
            <p className="text-xs font-bold text-mauve">
              {analytics.trend.length} ngày gần nhất
            </p>
          </div>
          <TrendChart trend={analytics.trend} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* Per-habit performance */}
        <div className="rounded-2xl border border-wafer bg-white/75 p-4">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-mauve">
            Từng thói quen
          </p>
          <div className="grid gap-3">
            {analytics.habitPerformance.slice(0, 5).map((habit, index) => (
              <div key={habit.habitId}>
                <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold">
                  <span className="flex min-w-0 items-center gap-2 text-mauve">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-rice text-[10px] text-mauve">
                      {index + 1}
                    </span>
                    <span className="truncate">{habit.habitName}</span>
                  </span>
                  <span className="shrink-0 text-plum">{formatPercent(habit.completionRate)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-wafer">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-matcha to-matcha-deep transition-all duration-500"
                    style={{ width: `${Math.max(clamp(habit.completionRate, 0, 1) * 100, 3)}%` }}
                  />
                </div>
              </div>
            ))}
            {analytics.habitPerformance.length === 0 ? (
              <p className="text-sm font-semibold text-mauve">Trồng một thói quen để thấy nhịp của nó 🌱</p>
            ) : null}
          </div>
        </div>

        {/* Gentle, no-guilt insights */}
        <div className="grid content-start gap-3 sm:grid-cols-2">
          <Insight
            icon={Award}
            label="Đều tay nhất"
            tone="matcha"
            value={analytics.mostConsistentHabitName}
          />
          <Insight
            icon={Sprout}
            label="Cần thêm chút yêu thương"
            tone="honey"
            value={analytics.habitNeedingAttentionName}
          />
        </div>
      </div>
    </section>
  );
}

/** SVG radial gauge; the arc draws itself once (still under reduced motion). */
function GaugeRing({ percent, value }: { percent: number; value: number }) {
  const offset = GAUGE_CIRCUMFERENCE * (1 - clamp(value, 0, 1));

  return (
    <svg
      aria-label={`Hoàn thành trung bình ${percent} phần trăm`}
      className="h-28 w-28 shrink-0"
      role="img"
      viewBox="0 0 140 140"
    >
      <defs>
        <linearGradient id="gauge-grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#7FB069" />
          <stop offset="100%" stopColor="#4C7A43" />
        </linearGradient>
      </defs>
      <circle cx="70" cy="70" fill="none" r={GAUGE_RADIUS} stroke="#F5E6E0" strokeWidth="13" />
      <circle
        className="gauge-draw"
        cx="70"
        cy="70"
        fill="none"
        r={GAUGE_RADIUS}
        stroke="url(#gauge-grad)"
        strokeDasharray={GAUGE_CIRCUMFERENCE}
        strokeLinecap="round"
        strokeWidth="13"
        transform="rotate(-90 70 70)"
        style={
          {
            strokeDashoffset: offset,
            "--gauge-circumference": `${GAUGE_CIRCUMFERENCE}px`
          } as CSSProperties
        }
      />
      <text
        className="fill-plum font-display"
        dominantBaseline="middle"
        fontSize="30"
        fontWeight="700"
        textAnchor="middle"
        x="70"
        y="66"
      >
        {percent}%
      </text>
      <text
        className="fill-mauve"
        fontSize="12"
        fontWeight="700"
        textAnchor="middle"
        x="70"
        y="90"
      >
        TB
      </text>
    </svg>
  );
}

/** Signed change vs the previous period — neutral, never shaming on a dip. */
function DeltaPill({ delta }: { delta: number }) {
  const rounded = Math.round(delta * 100);
  const Icon = rounded > 0 ? TrendingUp : rounded < 0 ? TrendingDown : Minus;
  const label = `${rounded > 0 ? "+" : ""}${rounded}%`;

  return (
    <span
      aria-label={`Thay đổi so với kỳ trước ${label}`}
      className={cn(
        "mt-1.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold",
        rounded > 0 ? "bg-matcha/15 text-matcha-deep" : "bg-wafer text-mauve"
      )}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {label}
      <span className="text-xs font-semibold text-mauve">so với kỳ trước</span>
    </span>
  );
}

const TREND_DOT: Record<DashboardStatus, string> = {
  Good: "bg-matcha",
  Okay: "bg-honey",
  Bad: "bg-sakura-deep",
  Planned: "bg-dawn",
  "No data": "bg-wafer"
};

/** Area + line completion trend. SVG uses a non-scaling stroke so the line
 *  stays crisp while the viewBox stretches; dots + labels are an HTML overlay
 *  (no distortion), and an sr-only list carries every value non-visually. */
function TrendChart({ trend }: { trend: DashboardViewModel["analytics"]["trend"] }) {
  if (trend.length === 0) {
    return <p className="text-sm font-semibold text-mauve">Mai quay lại để có điểm xu hướng đầu tiên nha 🌤️</p>;
  }

  const denominator = Math.max(1, trend.length - 1);
  const points = trend.map((point, index) => {
    const rate = clamp(point.completionRate, 0, 1);

    return {
      ...point,
      x: (index / denominator) * 100,
      y: 92 - rate * 84,
      bottomPercent: 8 + rate * 84,
      leftPercent: (index / denominator) * 100
    };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L 100 100 L 0 100 Z`;

  return (
    <div>
      <div className="trend-rise relative h-40 w-full">
        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <defs>
            <linearGradient id="trend-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#7FB069" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#7FB069" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* faint 50% guide line */}
          <line stroke="#F5E6E0" strokeDasharray="3 3" strokeWidth="0.5" x1="0" x2="100" y1="50" y2="50" />
          <path d={areaPath} fill="url(#trend-fill)" />
          <path
            d={linePath}
            fill="none"
            stroke="#4C7A43"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {points.map((point) => (
          <span
            className={cn(
              "absolute h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white shadow-sm",
              TREND_DOT[point.status]
            )}
            key={point.date}
            style={{ left: `${point.leftPercent}%`, bottom: `${point.bottomPercent}%` }}
            title={`${point.label}: ${formatPercent(point.completionRate)} (${point.status})`}
          />
        ))}
      </div>

      <div className="mt-2 flex justify-between text-[10px] font-bold text-mauve">
        {points.map((point, index) => (
          <span
            className={cn("whitespace-nowrap", index % 2 === 1 && "hidden sm:inline")}
            key={point.date}
          >
            {point.label}
          </span>
        ))}
      </div>

      <ul className="sr-only">
        {trend.map((point) => (
          <li key={point.date}>
            {point.label}: {formatPercent(point.completionRate)} ({point.status})
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone: "matcha" | "dawn";
}) {
  return (
    <div className="rounded-xl border border-wafer bg-rice/50 p-2.5">
      <div className="flex items-center gap-1.5 text-xs font-bold text-mauve">
        <Icon
          aria-hidden="true"
          className={cn("h-3.5 w-3.5", tone === "matcha" ? "text-matcha-deep" : "text-dawn-deep")}
        />
        {label}
      </div>
      <p className="mt-1 font-display text-xl font-bold text-plum">{value}</p>
    </div>
  );
}

function Insight({
  icon: Icon,
  label,
  value,
  tone
}: {
  icon: LucideIcon;
  label: string;
  value: string | null;
  tone: "matcha" | "honey";
}): ReactNode {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        tone === "matcha" ? "border-matcha/40 bg-matcha/5" : "border-butter bg-butter/15"
      )}
    >
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-mauve">
        <Icon
          aria-hidden="true"
          className={cn("h-4 w-4", tone === "matcha" ? "text-matcha-deep" : "text-honey")}
        />
        {label}
      </div>
      <p className="mt-1.5 break-words text-sm font-bold text-plum">{value ?? "Chưa có thói quen"}</p>
    </div>
  );
}

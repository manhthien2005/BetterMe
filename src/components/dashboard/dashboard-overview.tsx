"use client";

import { CheckCircle2, Flame, Sparkles, Target } from "lucide-react";

import type { CompletionStatus, DailyRecord, ISODateString, MotivationMessage } from "@/types";
import { buildSelectedWeekHabits, buildThirtyDayProgress } from "../../charts";
import { HabitChart } from "../charts/habit-chart";
import { ProgressChart } from "../charts/progress-chart";
import { getZonedToday } from "../../lib/date/index";
import { MOTIVATION_MESSAGES } from "../../data/motivation-messages";
import { useTracker } from "../../hooks/use-tracker";
import { MetricCard } from "./metric-card";
import { MotivationCard } from "./motivation-card";

export function DashboardOverview() {
  const tracker = useTracker();
  const data = tracker.state.data;

  if (!tracker.state.hydrated || !data) {
    return (
      <section aria-label="Dashboard">
        <h1>Dashboard</h1>
        <p>Loading dashboard...</p>
      </section>
    );
  }

  const today = getZonedToday(tracker.state.now, data.settings.timezone);
  const selectedDate = data.settings.selectedDate;
  const todayRecord = findRecord(tracker.records, today) ?? findRecord(tracker.records, selectedDate);
  const week = tracker.selectedWeek;
  const progressData = buildThirtyDayProgress(tracker.records, selectedDate, today);
  const habitData = week ? buildSelectedWeekHabits(tracker.records, data.habits, week.weekStart) : null;
  const motivation = todayRecord ? selectMotivationMessage(MOTIVATION_MESSAGES, todayRecord, today) : FALLBACK_MOTIVATION;

  return (
    <section aria-label="Dashboard" className="dashboard-overview">
      <header>
        <p>BetterMe</p>
        <h1>Dashboard</h1>
        <p>Your tiny daily corner for study, movement, focus, and reflection.</p>
      </header>

      <div className="dashboard-overview__metrics">
        <MetricCard icon={Target} title="Today progress" value={formatRate(todayRecord?.completionRate)} helper={todayRecord?.status ?? "No status yet"} />
        <MetricCard icon={CheckCircle2} title="Week average" value={formatRate(week?.averageCompletionRate)} helper={`${week?.goodDayCount ?? 0} good days`} tone="sky" />
        <MetricCard icon={Sparkles} title="Missed habits" value={`${todayRecord?.missedHabitNames.length ?? 0} missed`} helper={todayRecord?.missedHabitNames.join(", ") || "Nothing missed"} tone="rose" />
        <MetricCard icon={Flame} title="Current streak" value={`${todayRecord?.streak ?? 0}`} helper="Good days in a row" tone="amber" />
      </div>

      <MotivationCard message={motivation} />

      {week ? (
        <ul aria-label="Weekly quest preview" className="dashboard-overview__quest">
          {week.records.map((record) => (
            <li key={record.date}>
              <span>{record.dayLabel}</span>
              <strong>{record.status ?? "Not tracked"}</strong>
              <span>{formatRate(record.completionRate)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="dashboard-overview__charts">
        <ProgressChart data={progressData} />
        {habitData ? <HabitChart data={habitData} /> : null}
      </div>
    </section>
  );
}

export function selectMotivationMessage(
  messages: readonly MotivationMessage[],
  record: DailyRecord,
  date: ISODateString
): MotivationMessage {
  const status: CompletionStatus = record.status ?? "Planned";
  const candidates = messages.filter((message) => message.active && message.applicableStatuses.includes(status));
  if (candidates.length === 0) return FALLBACK_MOTIVATION;
  const weighted = candidates.flatMap((message) => Array.from({ length: Math.max(1, message.weight) }, () => message));
  return weighted[hash(`${date}:${status}`) % weighted.length];
}

function findRecord(records: readonly DailyRecord[], date: ISODateString) {
  return records.find((record) => record.date === date) ?? null;
}

function formatRate(rate: number | null | undefined) {
  return rate === null || rate === undefined ? "Planned" : `${Math.round(rate * 100)}%`;
}

function hash(input: string) {
  return Array.from(input).reduce((total, character) => total + character.charCodeAt(0), 0);
}

const FALLBACK_MOTIVATION: MotivationMessage = {
  id: "fallback",
  body: "Keep the promise tiny; tiny promises compound.",
  tone: "gentle",
  applicableStatuses: ["Good", "Okay", "Bad", "Planned"],
  active: true,
  weight: 1
};

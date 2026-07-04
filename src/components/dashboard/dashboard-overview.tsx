"use client";

import { CheckCircle2, Flame, Sparkles, Target } from "lucide-react";

import type { CompletionStatus, DailyRecord, ISODateString, MotivationMessage } from "@/types";
import { buildSelectedWeekHabits, buildThirtyDayProgress } from "../../charts";
import { HabitChart } from "../charts/habit-chart";
import { ProgressChart } from "../charts/progress-chart";
import { useI18n } from "../i18n/locale-provider";
import { getZonedToday } from "../../lib/date/index";
import { getMotivationMessages } from "../../data/motivation-messages";
import { useTracker } from "../../hooks/use-tracker";
import { MetricCard } from "./metric-card";
import { MotivationCard } from "./motivation-card";

export function DashboardOverview() {
  const tracker = useTracker();
  const data = tracker.state.data;
  const { dictionary, locale } = useI18n();

  if (!tracker.state.hydrated || !data) {
    return (
      <section aria-label="Dashboard">
        <h1>{dictionary.dashboard.title}</h1>
        <p>{dictionary.common.loading}</p>
      </section>
    );
  }

  const today = getZonedToday(tracker.state.now, data.settings.timezone);
  const selectedDate = data.settings.selectedDate;
  const todayRecord = findRecord(tracker.records, today) ?? findRecord(tracker.records, selectedDate);
  const week = tracker.selectedWeek;
  const progressData = buildThirtyDayProgress(tracker.records, selectedDate, today, dictionary.charts);
  const habitData = week ? buildSelectedWeekHabits(tracker.records, data.habits, week.weekStart, dictionary.charts) : null;
  const motivation = todayRecord ? selectMotivationMessage(getMotivationMessages(locale), todayRecord, today) : localizedFallback(dictionary);

  return (
    <section aria-label={dictionary.dashboard.title} className="dashboard-overview">
      <header>
        <p>{dictionary.dashboard.eyebrow}</p>
        <h1>{dictionary.dashboard.title}</h1>
        <p>{dictionary.dashboard.subtitle}</p>
      </header>

      <div className="dashboard-overview__metrics">
        <MetricCard icon={Target} title={dictionary.dashboard.todayProgress} value={formatRate(todayRecord?.completionRate, dictionary)} helper={formatStatus(todayRecord?.status, dictionary)} />
        <MetricCard icon={CheckCircle2} title={dictionary.dashboard.weekAverage} value={formatRate(week?.averageCompletionRate, dictionary)} helper={dictionary.dashboard.goodDays(week?.goodDayCount ?? 0)} tone="sky" />
        <MetricCard icon={Sparkles} title={dictionary.dashboard.missedHabits} value={dictionary.dashboard.missedCount(todayRecord?.missedHabitNames.length ?? 0)} helper={todayRecord?.missedHabitNames.join(", ") || dictionary.dashboard.nothingMissed} tone="rose" />
        <MetricCard icon={Flame} title={dictionary.dashboard.currentStreak} value={`${todayRecord?.streak ?? 0}`} helper={dictionary.dashboard.streakHelper} tone="amber" />
      </div>

      <MotivationCard message={motivation} />

      {week ? (
        <ul aria-label={dictionary.dashboard.weeklyQuestPreview} className="dashboard-overview__quest">
          {week.records.map((record) => (
            <li key={record.date}>
              <span>{record.dayLabel}</span>
              <strong>{formatStatus(record.status, dictionary)}</strong>
              <span>{formatRate(record.completionRate, dictionary)}</span>
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
  if (candidates.length === 0) return FALLBACK_MOTIVATION_EN;
  const weighted = candidates.flatMap((message) => Array.from({ length: Math.max(1, message.weight) }, () => message));
  return weighted[hash(`${date}:${status}`) % weighted.length];
}

function findRecord(records: readonly DailyRecord[], date: ISODateString) {
  return records.find((record) => record.date === date) ?? null;
}

function formatRate(rate: number | null | undefined, dictionary: ReturnType<typeof useI18n>["dictionary"]) {
  return rate === null || rate === undefined ? dictionary.common.planned : `${Math.round(rate * 100)}%`;
}

function formatStatus(status: CompletionStatus | null | undefined, dictionary: ReturnType<typeof useI18n>["dictionary"]) {
  return status ? dictionary.status[status] : dictionary.status.none;
}

function hash(input: string) {
  return Array.from(input).reduce((total, character) => total + character.charCodeAt(0), 0);
}

function localizedFallback(dictionary: ReturnType<typeof useI18n>["dictionary"]): MotivationMessage {
  return {
    id: "fallback",
    body: dictionary.locale === "vi" ? "Giữ lời hứa thật nhỏ; những lời hứa nhỏ sẽ cộng dồn." : "Keep the promise tiny; tiny promises compound.",
    tone: "gentle",
    applicableStatuses: ["Good", "Okay", "Bad", "Planned"],
    active: true,
    weight: 1
  };
}

const FALLBACK_MOTIVATION_EN: MotivationMessage = {
  id: "fallback",
  body: "Keep the promise tiny; tiny promises compound.",
  tone: "gentle",
  applicableStatuses: ["Good", "Okay", "Bad", "Planned"],
  active: true,
  weight: 1
};

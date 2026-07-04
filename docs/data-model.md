# BetterMe Phase 1 Data Model

## Canonical TypeScript contracts

The following block is the normative model and is duplicated exactly in `src/types/index.ts`. Field names are camelCase in TypeScript; legacy snake_case mappings are documented after the block.

```ts
export type ISODateString = `${number}-${number}-${number}`;
export type ISODateTimeString = string;

export type CompletionStatus = "Good" | "Okay" | "Bad" | "Planned";
export type ThemeId = "cute-cat" | "study-corner" | "modern-focus" | "minimal-calm";

export interface HabitConfig {
  key: string;
  name: string;
  category: string;
  maxScore: number;
  active: boolean;
  description: string;
  sortOrder: number;
}

export interface Habit extends HabitConfig {
  id: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface TrackerSettings {
  timezone: string;
  startDate: ISODateString;
  selectedDate: ISODateString;
  trackerDays: number;
  targetCompletionRate: number;
  themeId: ThemeId;
}

export interface ReflectionEntry {
  date: ISODateString;
  dailyNote: string;
  problemToday: string;
  tomorrowFocus: string;
  updatedAt: ISODateTimeString;
}

export interface HabitCompletionEntry {
  date: ISODateString;
  /** Keys are Habit.id values, never Habit.key values. */
  habitCompletions: Record<string, boolean>;
  updatedAt: ISODateTimeString;
}

export interface ScoreSummary {
  totalScore: number;
  maxScore: number;
  completionRate: number | null;
  status: CompletionStatus | null;
  missedHabitKeys: string[];
  missedHabitNames: string[];
}

export interface DailyRecord extends ScoreSummary {
  date: ISODateString;
  weekStart: ISODateString;
  dayLabel: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  /** Keys are Habit.id values, never Habit.key values. */
  habitCompletions: Record<string, boolean>;
  reflection: ReflectionEntry | null;
  streak: number | null;
}

export interface WeekSummary {
  weekStart: ISODateString;
  weekEnd: ISODateString;
  records: DailyRecord[];
  totalScore: number;
  maxScore: number;
  averageCompletionRate: number | null;
  goodDayCount: number;
  missedHabitCount: number;
  endingStreak: number | null;
}

export type ChartKind = "line" | "bar";
export type ChartColorToken =
  | "chart-series-1"
  | "chart-series-2"
  | "chart-series-3"
  | "status-good"
  | "status-okay"
  | "status-bad"
  | "status-planned";

export interface ChartPoint {
  key: string;
  label: string;
  value: number | null;
  secondaryLabel?: string;
}

export interface ChartSeries {
  id: string;
  label: string;
  colorToken: ChartColorToken;
  points: ChartPoint[];
}

export interface ChartData {
  id: "thirty-day-progress" | "selected-week-habits";
  title: string;
  description: string;
  kind: ChartKind;
  xAxisLabel: string;
  yAxisLabel: string;
  series: ChartSeries[];
}

export type RawColorToken =
  | "neutral-0"
  | "neutral-50"
  | "neutral-100"
  | "neutral-300"
  | "neutral-600"
  | "neutral-900"
  | "primary-100"
  | "primary-500"
  | "primary-700"
  | "accent-100"
  | "accent-500"
  | "good-100"
  | "good-700"
  | "okay-100"
  | "okay-700"
  | "bad-100"
  | "bad-700"
  | "planned-100"
  | "planned-700";

export type RawSpaceToken = "0" | "1" | "2" | "3" | "4" | "6" | "8" | "12";
export type RawRadiusToken = "none" | "sm" | "md" | "lg" | "xl" | "full";
export type RawShadowToken = "none" | "soft" | "raised" | "floating";
export type RawDurationToken = "instant" | "fast" | "normal" | "slow";
export type RawFontSizeToken = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type RawFontWeightToken = "regular" | "medium" | "semibold" | "bold";

export interface RawThemeTokens {
  colors: Record<RawColorToken, string>;
  fontFamilies: Record<"body" | "display" | "mono", string>;
  fontSizes: Record<RawFontSizeToken, string>;
  fontWeights: Record<RawFontWeightToken, number>;
  spacing: Record<RawSpaceToken, string>;
  radii: Record<RawRadiusToken, string>;
  shadows: Record<RawShadowToken, string>;
  durations: Record<RawDurationToken, string>;
  easing: Record<"standard" | "emphasized" | "gentle", string>;
}

export interface SemanticColorTokens {
  background: RawColorToken;
  backgroundAccent: RawColorToken;
  surface: RawColorToken;
  surfaceMuted: RawColorToken;
  text: RawColorToken;
  textMuted: RawColorToken;
  textOnPrimary: RawColorToken;
  primary: RawColorToken;
  primaryHover: RawColorToken;
  accent: RawColorToken;
  border: RawColorToken;
  focus: RawColorToken;
  disabled: RawColorToken;
  selection: RawColorToken;
  statusGoodSurface: RawColorToken;
  statusGoodText: RawColorToken;
  statusOkaySurface: RawColorToken;
  statusOkayText: RawColorToken;
  statusBadSurface: RawColorToken;
  statusBadText: RawColorToken;
  statusPlannedSurface: RawColorToken;
  statusPlannedText: RawColorToken;
}

export interface SemanticTypographyTokens {
  bodyFamily: keyof RawThemeTokens["fontFamilies"];
  displayFamily: keyof RawThemeTokens["fontFamilies"];
  monoFamily: keyof RawThemeTokens["fontFamilies"];
  bodySize: RawFontSizeToken;
  labelSize: RawFontSizeToken;
  headingSize: RawFontSizeToken;
  metricSize: RawFontSizeToken;
  bodyWeight: RawFontWeightToken;
  labelWeight: RawFontWeightToken;
  headingWeight: RawFontWeightToken;
  lineHeightBody: number;
  lineHeightHeading: number;
  letterSpacingLabel: string;
}

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  mode: "light";
  raw: RawThemeTokens;
  semantic: {
    colors: SemanticColorTokens;
    typography: SemanticTypographyTokens;
    radius: Record<"control" | "card" | "panel" | "pill" | "illustration", RawRadiusToken>;
    cardFrame: {
      style: "soft" | "notebook" | "crisp" | "quiet";
      borderWidth: string;
      shadow: RawShadowToken;
      highlight: "none" | "inset" | "edge";
    };
    icon: {
      style: "line" | "filled" | "duotone";
      strokeWidth: number;
      containerShape: "none" | "circle" | "rounded-square" | "sticker";
      decorativeTreatment: string;
    };
    illustration: {
      style: "cat-sticker" | "hand-drawn-study" | "geometric" | "calm-botanical";
      density: "sparse" | "balanced";
      emptyStateKey: string;
    };
    background: {
      treatment: "solid" | "gradient" | "pattern" | "wash";
      pattern: "none" | "paws-stars" | "notebook-grid" | "geometry" | "botanical";
      patternOpacity: number;
      patternScale: string;
    };
    motion: {
      fast: RawDurationToken;
      normal: RawDurationToken;
      slow: RawDurationToken;
      easing: keyof RawThemeTokens["easing"];
      hoverLift: string;
      pressScale: number;
      reveal: "fade" | "fade-slide" | "soft-scale";
    };
    toast: {
      radius: RawRadiusToken;
      shadow: RawShadowToken;
      entrance: "fade" | "slide" | "pop";
      iconContainer: "circle" | "rounded-square" | "sticker";
    };
    chart: {
      gridColor: RawColorToken;
      axisColor: RawColorToken;
      tooltipSurface: RawColorToken;
      cursorColor: RawColorToken;
      seriesColors: [RawColorToken, RawColorToken, RawColorToken];
      lineStyle: "smooth" | "straight";
      pointShape: "circle" | "rounded-square" | "paw";
      barRadius: RawRadiusToken;
    };
    emptyState: {
      frame: "card" | "open" | "note";
      actionStyle: "primary" | "quiet";
      tone: "playful" | "encouraging" | "direct" | "reflective";
    };
    microInteractions: {
      checkbox: "bounce" | "highlight" | "snap" | "fade";
      streak: "spark" | "underline" | "pulse" | "none";
      cardHover: "lift" | "border" | "glow" | "none";
      saveConfirmation: "toast" | "inline";
      themeSwitch: "crossfade" | "wipe" | "instant";
    };
  };
}

export interface MotivationMessage {
  id: string;
  body: string;
  tone: "gentle" | "focused" | "playful" | "reflective";
  applicableStatuses: CompletionStatus[];
  illustrationKey?: string;
  active: boolean;
  weight: number;
}

export interface BetterMeData {
  schemaVersion: 1;
  habits: Habit[];
  habitEntries: HabitCompletionEntry[];
  reflections: ReflectionEntry[];
  settings: TrackerSettings;
  updatedAt: ISODateTimeString;
}

export interface StorageAdapter {
  load(): Promise<BetterMeData | null>;
  save(data: BetterMeData): Promise<void>;
  clear(): Promise<void>;
}
```

## Relationships

- `HabitConfig` is the editable habit shape; `Habit` adds stable identity and timestamps. Historical completion maps use `Habit.id`, while `Habit.key` remains a stable human-readable/export key.
- `HabitCompletionEntry` is one date’s source completion map. Its `habitCompletions` keys are `Habit.id` values, never `Habit.key` values. Missing keys are interpreted as `false`; inactive habits remain stored but are ignored by scoring.
- `ReflectionEntry` is one date’s source reflection. A derived `DailyRecord` embeds the matching reflection so UI consumers do not perform joins.
- `DailyRecord` is a derived read model joining one completion entry, an optional matching reflection, settings, active habits, date metadata, score, missed habits, status, and streak. `reflection` is `null` when that date has no persisted reflection; form components create transient empty field values without fabricating an `updatedAt` timestamp.
- `WeekSummary` aggregates seven `DailyRecord` values for a Monday–Sunday window.
- `ChartData` is a renderer-neutral projection of daily/weekly read models. `colorToken` names are semantic chart references, not raw colors.
- `ThemeDefinition` separates raw theme values from semantic product mappings. `TrackerSettings.themeId` selects one definition.
- `BetterMeData` is the only persisted root. It excludes `DailyRecord`, `ScoreSummary`, `WeekSummary`, and `ChartData` because they are derived.

## Legacy field mapping

| Legacy field | Canonical field |
|---|---|
| `habit_key` | `HabitConfig.key` |
| `habit_name` | `HabitConfig.name` |
| `max_score` | `HabitConfig.maxScore` / `ScoreSummary.maxScore` |
| `start_date` | `TrackerSettings.startDate` |
| `selected_date` | `TrackerSettings.selectedDate` |
| `tracker_days` | `TrackerSettings.trackerDays` |
| `target_completion_rate` | `TrackerSettings.targetCompletionRate` |
| `week_start` | `DailyRecord.weekStart` |
| `day_label` | `DailyRecord.dayLabel` |
| habit Boolean columns | `HabitCompletionEntry.habitCompletions` |
| `daily_note` | `ReflectionEntry.dailyNote` |
| `problem_today` | `ReflectionEntry.problemToday` |
| `tomorrow_focus` | `ReflectionEntry.tomorrowFocus` |
| `total_score` | `ScoreSummary.totalScore` |
| `completion_rate` | `ScoreSummary.completionRate` |
| missed key/name arrays | `ScoreSummary.missedHabitKeys` / `missedHabitNames` |

## Calculation rules

Given `activeHabits = habits.filter(habit => habit.active)`:

```text
maxScore = Σ activeHabit.maxScore
totalScore = Σ (habitCompletions[activeHabit.id] ? activeHabit.maxScore : 0)
completionRate = maxScore > 0 ? totalScore / maxScore : 0
```

- Weights must be finite and non-negative. `targetCompletionRate` must be between 0 and 1 inclusive.
- On an eligible date at or before zoned today: `Good` when rate is at least target; otherwise `Okay` when rate is at least 0.5; otherwise `Bad`.
- After zoned today: status is `Planned`, rate is `null`, and streak is `null`.
- Before `startDate`: status, rate, and streak are `null`; the date is untracked rather than Bad.
- Missed arrays contain active incomplete habits in ascending `sortOrder`, then ascending `Habit.id` ASCII code-unit order for deterministic ties.
- Sort eligible records ascending by ISO date. Initialize running streak to zero; for each record, increment for `Good`, otherwise reset to zero. Store the running value. Planned and pre-start records have null streak and do not extend it.
- `WeekSummary.averageCompletionRate` averages only non-null daily rates. It is null when no eligible day exists.
- `WeekSummary.endingStreak` is the final eligible record’s streak, or `null` when the week contains no eligible record.
- The selected-week habit chart denominator is the count of eligible selected-week records, matching the legacy behavior. The 30-day chart is anchored to the earlier of selected date and zoned today.

## Timezone and date rules

ISO date strings represent calendar dates, not instants. “Today” is derived by formatting the supplied clock instant in `TrackerSettings.timezone`. Weeks begin Monday. Date addition, month grids, start/end comparisons, chart anchors, and planned-state decisions occur only in `src/lib/date/` and receive the timezone explicitly whenever an instant is involved.

## Local/mock storage shape

The browser key is `betterme:data`. Its JSON value is exactly one `BetterMeData` envelope with `schemaVersion: 1`. Writes replace the envelope atomically from the app’s perspective. The memory adapter stores a deep-cloned envelope so tests cannot mutate adapter state by reference.

On a missing key, `load()` returns `null` and the store seeds defaults. On invalid JSON or schema mismatch, the adapter raises a classified validation error; the store exposes recovery rather than silently treating corruption as an empty Bad day.

## Future database readiness

- Stable IDs and timestamps make habits and dated source entries directly mappable to tables/documents.
- The single-user envelope can be decomposed into habits, daily completions, reflections, and settings repositories without changing domain calculations.
- User ownership belongs in remote DTOs/repositories, not Phase 1 domain types. An authenticated adapter can inject ownership at the boundary.
- Optimistic concurrency/version metadata can be added to adapter DTOs while `BetterMeData` remains the store-facing aggregate.
- Derived values should remain computed on the client/domain layer or a shared package; a database cache may accelerate reads but is never authoritative.

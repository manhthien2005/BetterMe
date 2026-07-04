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

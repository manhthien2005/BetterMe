import type { ISODateString } from "@/types";
import { useI18n } from "../i18n/locale-provider";

export interface WeekNavigationProps {
  weekStart: ISODateString;
  onPrevious(): void;
  onNext(): void;
}

export function WeekNavigation({ weekStart, onPrevious, onNext }: WeekNavigationProps) {
  const { dictionary } = useI18n();

  return (
    <div aria-label="Week navigation" className="week-navigation">
      <button onClick={onPrevious} type="button">{dictionary.common.previousWeek}</button>
      <span>{formatWeekLabel(weekStart)}</span>
      <button onClick={onNext} type="button">{dictionary.common.nextWeek}</button>
    </div>
  );
}

function formatWeekLabel(date: ISODateString) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

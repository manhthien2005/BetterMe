import type { ISODateString } from "@/types";

export interface WeekNavigationProps {
  weekStart: ISODateString;
  onPrevious(): void;
  onNext(): void;
}

export function WeekNavigation({ weekStart, onPrevious, onNext }: WeekNavigationProps) {
  return (
    <div aria-label="Week navigation" className="week-navigation">
      <button onClick={onPrevious} type="button">Previous week</button>
      <span>{formatWeekLabel(weekStart)}</span>
      <button onClick={onNext} type="button">Next week</button>
    </div>
  );
}

function formatWeekLabel(date: ISODateString) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

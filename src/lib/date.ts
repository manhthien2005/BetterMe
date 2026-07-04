export function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function todayIso() {
  return toIsoDate(new Date());
}

export function addDaysIso(value: string, days: number) {
  const date = parseIsoDate(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function compareIsoDates(a: string, b: string) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function minIsoDate(...dates: string[]) {
  return dates.reduce((min, date) => (date < min ? date : min));
}

export function maxIsoDate(...dates: string[]) {
  return dates.reduce((max, date) => (date > max ? date : max));
}

export function getWeekStartIso(value: string) {
  const date = parseIsoDate(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return toIsoDate(date);
}

export function getWeekEndIso(value: string) {
  return addDaysIso(getWeekStartIso(value), 6);
}

export function getDayLabel(value: string) {
  const day = parseIsoDate(value).getDay();
  if (day === 0) return "Sun";
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day - 1];
}

export function getMonthGrid(selectedDate: string) {
  const selected = parseIsoDate(selectedDate);
  const monthStart = new Date(selected.getFullYear(), selected.getMonth(), 1);
  const firstGrid = getWeekStartIso(toIsoDate(monthStart));
  const days: string[] = [];

  for (let i = 0; i < 42; i += 1) {
    days.push(addDaysIso(firstGrid, i));
  }

  return days;
}

export function formatDisplayDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    ...options
  }).format(parseIsoDate(value));
}

export function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(parseIsoDate(value));
}

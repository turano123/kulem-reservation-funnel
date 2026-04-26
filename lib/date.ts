export function addDays(dateString: string, days: number) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function eachDate(checkin: string, checkout: string) {
  const dates: string[] = [];
  let cursor = checkin;
  while (cursor < checkout) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

export function getWeekday(dateString: string) {
  return new Date(dateString).getDay();
}

export function isWeekend(dateString: string) {
  const day = getWeekday(dateString);
  return day === 5 || day === 6;
}

export function getMonthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    days: end.getDate()
  };
}

export function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay();
}

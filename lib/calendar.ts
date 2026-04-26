import { firstDayOfMonth } from "./date";

const monthNames = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık"
];

export const weekdayLabels = ["P", "P", "S", "Ç", "P", "C", "C"];

export function getMonthLabel(month: number, year: number) {
  return `${monthNames[month - 1]} ${year}`;
}

export function buildCalendarCells(
  cells: Array<{ date: string; status: "available" | "blocked" | "pending" }>,
  month: number,
  year: number
) {
  const leading = (firstDayOfMonth(year, month) + 6) % 7;
  const prefix = Array.from({ length: leading }).map((_, index) => ({
    key: `empty-${index}`,
    type: "empty" as const
  }));

  const days = cells.map((cell, index) => ({
    key: `${cell.date}-${index}`,
    type: "day" as const,
    date: cell.date,
    status: cell.status,
    day: Number(cell.date.slice(-2))
  }));

  return [...prefix, ...days];
}

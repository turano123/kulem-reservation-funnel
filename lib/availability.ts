import type { Property } from "./types";
import { addDays, eachDate, getMonthRange } from "./date";

type SheetStatus = "BOŞ" | "BOS" | "DOLU" | "PENDING" | "BEKLEMEDE";

type LiveDay = {
  date: string;
  status?: string;
  durum?: string;
  price?: number | string;
  fiyat?: number | string;
};

function getLiveRows(property: Property): LiveDay[] {
  const source = property as Property & {
    liveRows?: LiveDay[];
    calendarRows?: LiveDay[];
    availabilityRows?: LiveDay[];
    sheetRows?: LiveDay[];
  };

  return (
    source.liveRows ??
    source.calendarRows ??
    source.availabilityRows ??
    source.sheetRows ??
    []
  );
}

function normalizeStatus(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace("Ş", "S");
}

function liveStatusToRangeStatus(value: unknown) {
  const status = normalizeStatus(value);

  if (status === "BOS" || status === "BOŞ") return "available";
  if (status === "DOLU") return "blocked";
  if (status === "PENDING" || status === "BEKLEMEDE") return "pending";

  return "blocked";
}

function findLiveDay(property: Property, date: string) {
  return getLiveRows(property).find((row) => row.date === date);
}

function overlaps(
  rangeStart: string,
  rangeEnd: string,
  checkin: string,
  checkout: string
) {
  return checkin < rangeEnd && checkout > rangeStart;
}

export function getRangeStatus(
  property: Property,
  checkin: string,
  checkout: string
) {
  const liveRows = getLiveRows(property);
  const dates = eachDate(checkin, checkout);

  if (liveRows.length > 0) {
    for (const date of dates) {
      const row = findLiveDay(property, date);

      if (!row) {
        return "blocked";
      }

      const status = liveStatusToRangeStatus(row.status ?? row.durum);

      if (status !== "available") {
        return status;
      }
    }

    return "available";
  }

  for (const range of property.bookedRanges) {
    if (overlaps(range.start, range.end, checkin, checkout)) {
      return range.type ?? "blocked";
    }
  }

  return "available";
}

export function isRangeAvailable(
  property: Property,
  checkin: string,
  checkout: string
) {
  return getRangeStatus(property, checkin, checkout) === "available";
}

export function findNextAvailableWindow(
  property: Property,
  startDate: string,
  nights: number,
  limitDays = 90
) {
  let cursor = startDate;

  for (let i = 0; i < limitDays; i += 1) {
    const checkout = addDays(cursor, nights);

    if (isRangeAvailable(property, cursor, checkout)) {
      return { checkin: cursor, checkout };
    }

    cursor = addDays(cursor, 1);
  }

  return null;
}

export function getMonthCalendar(property: Property, year: number, month: number) {
  const { days } = getMonthRange(year, month);
  const cells: Array<{
    date: string;
    status: "available" | "blocked" | "pending";
  }> = [];

  for (let day = 1; day <= days; day += 1) {
    const date = new Date(year, month - 1, day).toISOString().slice(0, 10);
    const status = getRangeStatus(property, date, addDays(date, 1));

    cells.push({
      date,
      status: status === "available" ? "available" : status
    });
  }

  return cells;
}
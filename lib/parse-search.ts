import { toNumber, toStringValue } from "./utils";
import type { FlexibleSearchInput, SearchInput } from "./types";

export function parseChildAges(raw: string | string[] | undefined) {
  const source = Array.isArray(raw) ? raw[0] : raw;
  if (!source) return [];
  return source
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
}

export function parseSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): SearchInput {
  const mode = toStringValue(searchParams.mode, "exact");

  if (mode === "flexible") {
    const payload: FlexibleSearchInput = {
      mode: "flexible",
      durationLabel: toStringValue(searchParams.duration, "2gece"),
      monthLabel: toStringValue(searchParams.month, "mayis-2026"),
      adults: toNumber(searchParams.adults, 2),
      children: toNumber(searchParams.children, 0),
      childAges: parseChildAges(searchParams.childAges)
    };
    return payload;
  }

  return {
    mode: "exact",
    checkin: toStringValue(searchParams.checkin),
    checkout: toStringValue(searchParams.checkout),
    adults: toNumber(searchParams.adults, 2),
    children: toNumber(searchParams.children, 0),
    childAges: parseChildAges(searchParams.childAges),
    breakfast: toStringValue(searchParams.breakfast) === "true"
  };
}

import type { Property } from "./types";
import { eachDate, isWeekend } from "./date";

type LiveDay = {
  date: string;
  status?: string;
  durum?: string;
  price?: number | string;
  fiyat?: number | string;
};

type PriceNight = {
  date: string;
  type: "weekday" | "weekend";
  basePrice: number;
  extraAdultFee: number;
  price: number;
  unavailable?: true;
};

const EXTRA_ADULT_PRICE_PER_NIGHT = 1000;

const INCLUDED_ADULTS_BY_PROPERTY: Record<string, number> = {
  "kule-yesil-ev": 2,
  "kule-suit": 2,
  "kule-deluxe": 4
};

function getIncludedAdults(property: Property) {
  const propertyId = String(
    (property as Property & { id?: string; slug?: string; propertyId?: string })
      .id ??
      (property as Property & { slug?: string }).slug ??
      (property as Property & { propertyId?: string }).propertyId ??
      ""
  )
    .trim()
    .toLowerCase();

  return INCLUDED_ADULTS_BY_PROPERTY[propertyId] ?? 2;
}

function getExtraAdultCount(property: Property, adults: number) {
  const safeAdults = Math.max(0, Number(adults) || 0);
  const includedAdults = getIncludedAdults(property);

  return Math.max(0, safeAdults - includedAdults);
}

function getExtraAdultFeePerNight(property: Property, adults: number) {
  return getExtraAdultCount(property, adults) * EXTRA_ADULT_PRICE_PER_NIGHT;
}

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

function normalizePrice(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const cleaned = String(value ?? "")
    .replace(/[₺\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = Number(cleaned);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function normalizeStatus(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace("Ş", "S");
}

function isLiveAvailable(value: unknown) {
  const status = normalizeStatus(value);
  return status === "BOS" || status === "BOŞ";
}

function findLiveDay(property: Property, date: string) {
  return getLiveRows(property).find((row) => row.date === date);
}

export function calculatePrice(
  property: Property,
  checkin: string,
  checkout: string,
  adults: number,
  children: number,
  breakfast: boolean
) {
  const dates = eachDate(checkin, checkout);
  const liveRows = getLiveRows(property);
  const extraAdultFeePerNight = getExtraAdultFeePerNight(property, adults);

  if (liveRows.length > 0) {
    const nightlyBreakdown: PriceNight[] = dates.map((date) => {
      const row = findLiveDay(property, date);
      const basePrice = normalizePrice(row?.price ?? row?.fiyat);
      const type = isWeekend(date) ? "weekend" : "weekday";

      if (!row || !isLiveAvailable(row.status ?? row.durum) || basePrice === null) {
        return {
          date,
          type,
          basePrice: 0,
          extraAdultFee: 0,
          price: 0,
          unavailable: true
        };
      }

      return {
        date,
        type,
        basePrice,
        extraAdultFee: extraAdultFeePerNight,
        price: basePrice + extraAdultFeePerNight
      };
    });

    const hasInvalidNight = nightlyBreakdown.some((night) => night.unavailable);

    const roomTotal = hasInvalidNight
      ? 0
      : nightlyBreakdown.reduce((sum, night) => sum + night.price, 0);

    const baseRoomTotal = hasInvalidNight
      ? 0
      : nightlyBreakdown.reduce((sum, night) => sum + night.basePrice, 0);

    const extraAdultTotal = hasInvalidNight
      ? 0
      : nightlyBreakdown.reduce((sum, night) => sum + night.extraAdultFee, 0);

    const breakfastTotal =
      !hasInvalidNight && breakfast && property.breakfastPricing
        ? nightlyBreakdown.length *
          (adults * property.breakfastPricing.adultPerNight +
            children * property.breakfastPricing.childPerNight)
        : 0;

    return {
      total: roomTotal + breakfastTotal,
      roomTotal,
      baseRoomTotal,
      extraAdultTotal,
      breakfastTotal,
      includedAdults: getIncludedAdults(property),
      extraAdults: getExtraAdultCount(property, adults),
      nightlyBreakdown
    };
  }

  const nightlyBreakdown: PriceNight[] = dates.map((date) => {
    const weekend = isWeekend(date);
    const basePrice = weekend ? property.rates.weekend : property.rates.weekday;

    return {
      date,
      type: weekend ? "weekend" : "weekday",
      basePrice,
      extraAdultFee: extraAdultFeePerNight,
      price: basePrice + extraAdultFeePerNight
    };
  });

  const roomTotal = nightlyBreakdown.reduce((sum, night) => sum + night.price, 0);
  const baseRoomTotal = nightlyBreakdown.reduce(
    (sum, night) => sum + night.basePrice,
    0
  );
  const extraAdultTotal = nightlyBreakdown.reduce(
    (sum, night) => sum + night.extraAdultFee,
    0
  );

  const breakfastTotal =
    breakfast && property.breakfastPricing
      ? nightlyBreakdown.length *
        (adults * property.breakfastPricing.adultPerNight +
          children * property.breakfastPricing.childPerNight)
      : 0;

  return {
    total: roomTotal + breakfastTotal,
    roomTotal,
    baseRoomTotal,
    extraAdultTotal,
    breakfastTotal,
    includedAdults: getIncludedAdults(property),
    extraAdults: getExtraAdultCount(property, adults),
    nightlyBreakdown
  };
}

export function getStartingPrice(property: Property, nights: number) {
  const liveRows = getLiveRows(property);

  if (liveRows.length > 0) {
    const availablePrices = liveRows
      .filter((row) => isLiveAvailable(row.status ?? row.durum))
      .map((row) => normalizePrice(row.price ?? row.fiyat))
      .filter((price): price is number => price !== null);

    if (availablePrices.length > 0) {
      return Math.min(...availablePrices) * nights;
    }
  }

  return property.rates.weekday * nights;
}
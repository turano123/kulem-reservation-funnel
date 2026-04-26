import { durationOptions, monthOptions } from "./mock-data";
import { getAllProperties } from "./properties";
import {
  findNextAvailableWindow,
  getRangeStatus,
  isRangeAvailable
} from "./availability";
import { calculatePrice, getStartingPrice } from "./pricing";
import type {
  ExactSearchInput,
  FlexibleSearchInput,
  SearchInput,
  SearchResult
} from "./types";

export async function searchProperties(
  input: SearchInput
): Promise<SearchResult[]> {
  if (input.mode === "exact") {
    return searchExact(input);
  }

  return searchFlexible(input);
}

async function searchExact(input: ExactSearchInput): Promise<SearchResult[]> {
  const properties = await getAllProperties();
  const partySize = input.adults + input.children;

  const results = properties
    .map((property): SearchResult | null => {
      if (partySize > property.maxGuests) {
        return null;
      }

      const status = getRangeStatus(property, input.checkin, input.checkout);

      if (status !== "available") {
        return null;
      }

      const pricing = calculatePrice(
        property,
        input.checkin,
        input.checkout,
        input.adults,
        input.children,
        input.breakfast
      );

      if (!pricing.total || pricing.total <= 0) {
        return null;
      }

      return {
        property,
        status: "available",
        label: `${input.checkin} - ${input.checkout} için uygun`,
        totalPrice: pricing.total,
        nightlyBreakdown: pricing.nightlyBreakdown
      };
    })
    .filter((item): item is SearchResult => item !== null)
    .sort((a, b) => {
      const priceA = a.totalPrice ?? Number.MAX_SAFE_INTEGER;
      const priceB = b.totalPrice ?? Number.MAX_SAFE_INTEGER;
      return priceA - priceB;
    });

  return results;
}

async function searchFlexible(
  input: FlexibleSearchInput
): Promise<SearchResult[]> {
  const properties = await getAllProperties();
  const partySize = input.adults + input.children;

  const duration =
    durationOptions.find((item) => item.value === input.durationLabel) ??
    durationOptions[1];

  const monthOption =
    monthOptions.find((item) => item.value === input.monthLabel) ??
    monthOptions[0];

  const suggestions = Array.from({ length: 4 }).map((_, index) => {
    const start = new Date(monthOption.year, monthOption.month - 1, 1 + index * 7);
    return start.toISOString().slice(0, 10);
  });

  return properties
    .map((property): SearchResult | null => {
      if (partySize > property.maxGuests) {
        return null;
      }

      const suggestion = suggestions
        .map((checkin) => {
          const checkout = new Date(checkin);
          checkout.setDate(checkout.getDate() + duration.nights);

          return {
            checkin,
            checkout: checkout.toISOString().slice(0, 10)
          };
        })
        .find((window) =>
          isRangeAvailable(property, window.checkin, window.checkout)
        );

      if (!suggestion) {
        return null;
      }

      const startingPrice = getStartingPrice(property, duration.nights);

      if (!startingPrice || startingPrice <= 0) {
        return null;
      }

      return {
        property,
        status: "available",
        label: `${monthOption.label} içinde önerilen dönem`,
        startingPrice,
        suggestion
      };
    })
    .filter((item): item is SearchResult => item !== null)
    .sort((a, b) => {
      const priceA = a.startingPrice ?? Number.MAX_SAFE_INTEGER;
      const priceB = b.startingPrice ?? Number.MAX_SAFE_INTEGER;
      return priceA - priceB;
    });
}
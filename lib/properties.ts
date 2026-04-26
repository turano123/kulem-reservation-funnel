import { getPropertiesFromSheet } from "./integrations/googleSheets";
import type { Property } from "./types";

const PROPERTY_IMAGE_MAP: Record<
  string,
  {
    heroImage: string;
    gallery: string[];
  }
> = {
  "kule-yesil-ev": {
    heroImage: "/uploads/kule-yesil-ev-hero.jpg",
    gallery: [
      "/uploads/kule-yesil-ev-hero.jpg",
      "/uploads/kule-yesil-ev-1.jpg",
      "/uploads/kule-yesil-ev-2.jpg",
      "/uploads/kule-yesil-ev-3.jpg",
      "/uploads/kule-yesil-ev-4.jpg",
      "/uploads/kule-yesil-ev-5.jpg",
      "/uploads/kule-yesil-ev-6.jpg",
      "/uploads/kule-yesil-ev-7.jpg",
      "/uploads/kule-yesil-ev-8.jpg",
      "/uploads/kule-yesil-ev-9.jpg",
      "/uploads/kule-yesil-ev-10.jpg"
      
    ]
  },

  "kule-suit": {
    heroImage: "/uploads/kule-suit-hero.jpg",
    gallery: [
      "/uploads/kule-suit-hero.jpg",
      "/uploads/kule-suit-1.jpg",
      "/uploads/kule-suit-2.jpg",
      "/uploads/kule-suit-3.jpg",
      "/uploads/kule-suit-4.jpg",
      "/uploads/kule-suit-5.jpg",
      "/uploads/kule-suit-6.jpg",
      "/uploads/kule-suit-7.jpg",
      "/uploads/kule-suit-8.jpg",
      "/uploads/kule-suit-9.jpg",
      "/uploads/kule-suit-10.jpg",
      "/uploads/kule-suit-11.jpg",
      "/uploads/kule-suit-12.jpg",
      "/uploads/kule-suit-13.jpg",
      "/uploads/kule-suit-14.jpg"
    ]
  },

  "kule-deluxe": {
    heroImage: "/uploads/kule-deluxe-hero.jpg",
    gallery: [
      "/uploads/kule-deluxe-hero.jpg",
      "/uploads/kule-deluxe-1.jpg",
      "/uploads/kule-deluxe-2.jpg",
      "/uploads/kule-deluxe-3.jpg",
      "/uploads/kule-deluxe-4.jpg",
      "/uploads/kule-deluxe-5.jpg",
      "/uploads/kule-deluxe-6.jpg",
      "/uploads/kule-deluxe-7.jpg",
      "/uploads/kule-deluxe-8.jpg",
      "/uploads/kule-deluxe-9.jpg",
      "/uploads/kule-deluxe-10.jpg"
    ]
  }
};

type GooglePlaceDetails = {
  rating?: number;
  userRatingCount?: number;
};

type GoogleTextSearchResponse = {
  places?: Array<{
    id?: string;
    displayName?: {
      text?: string;
      languageCode?: string;
    };
    formattedAddress?: string;
    rating?: number;
    userRatingCount?: number;
  }>;
};

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR");
}

function pickBestGooglePlace(data: GoogleTextSearchResponse) {
  const places = data.places ?? [];

  if (!places.length) {
    return null;
  }

  const exactMatch = places.find((place) => {
    const name = normalizeText(place.displayName?.text);
    const address = normalizeText(place.formattedAddress);

    return (
      name.includes("kule sapanca") &&
      (address.includes("sapanca") || address.includes("sakarya"))
    );
  });

  return exactMatch ?? places[0] ?? null;
}

async function getGoogleReviewData(): Promise<GooglePlaceDetails | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        next: { revalidate: 60 * 60 * 12 },
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount"
        },
        body: JSON.stringify({
          textQuery: "KULE SAPANCA Şükriye Sapanca Sakarya",
          languageCode: "tr",
          regionCode: "TR"
        })
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as GoogleTextSearchResponse;
    const place = pickBestGooglePlace(data);

    if (!place) {
      return null;
    }

    return {
      rating: isValidNumber(place.rating) ? place.rating : undefined,
      userRatingCount: isValidNumber(place.userRatingCount)
        ? place.userRatingCount
        : undefined
    };
  } catch {
    return null;
  }
}

function enrichPropertyImages(property: Property): Property {
  const images = PROPERTY_IMAGE_MAP[property.slug];

  if (!images) {
    return property;
  }

  return {
    ...property,
    heroImage: images.heroImage,
    gallery: images.gallery
  };
}

function enrichPropertyGoogleReviewData(
  property: Property,
  googleData: GooglePlaceDetails | null
): Property {
  if (!googleData) {
    return property;
  }

  return {
    ...property,
    reviewScore: googleData.rating ?? property.reviewScore,
    reviewCount: googleData.userRatingCount ?? property.reviewCount
  };
}

export async function getAllProperties() {
  const [items, googleData] = await Promise.all([
    getPropertiesFromSheet(),
    getGoogleReviewData()
  ]);

  return items
    .map((property) => {
      const withImages = enrichPropertyImages(property);
      return enrichPropertyGoogleReviewData(withImages, googleData);
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getPropertyBySlug(slug: string) {
  const items = await getAllProperties();
  return items.find((item) => item.slug === slug) ?? null;
}
import type { Review } from "@/lib/types";

type GoogleReviewText = {
  text?: string;
  languageCode?: string;
};

type GoogleReview = {
  name?: string;
  relativePublishTimeDescription?: string;
  rating?: number;
  text?: GoogleReviewText;
  originalText?: GoogleReviewText;
  authorAttribution?: {
    displayName?: string;
    uri?: string;
    photoUri?: string;
  };
  publishTime?: string;
};

type GooglePlace = {
  id?: string;
  displayName?: {
    text?: string;
    languageCode?: string;
  };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: GoogleReview[];
};

type GoogleTextSearchResponse = {
  places?: GooglePlace[];
};

type GoogleBusinessReviewsPayload = {
  businessName: string;
  rating: number;
  reviewCount: number;
  url: string;
  reviews: Review[];
};

const FALLBACK_GOOGLE_REVIEWS: GoogleBusinessReviewsPayload = {
  businessName: "KULE SAPANCA",
  rating: 4.9,
  reviewCount: 254,
  url: process.env.GOOGLE_BUSINESS_REVIEW_URL ?? "",
  reviews: [
    {
      id: "fallback-google-1",
      authorName: "Google Misafiri",
      rating: 5,
      text: "Konum, temizlik ve işletme ilgisi çok güzeldi. Ailemizle keyifli bir konaklama geçirdik."
    },
    {
      id: "fallback-google-2",
      authorName: "Google Misafiri",
      rating: 5,
      text: "Havuz, jakuzi ve doğa içindeki konum beklentimizin üzerindeydi."
    },
    {
      id: "fallback-google-3",
      authorName: "Google Misafiri",
      rating: 5,
      text: "İşletme hızlı dönüş yaptı, konaklama süreci sorunsuz geçti."
    }
  ] as unknown as Review[]
};

function normalizeGoogleReview(review: GoogleReview, index: number): Review {
  return {
    id: review.name ?? `google-review-${index}`,
    authorName: review.authorAttribution?.displayName ?? "Google Misafiri",
    rating: review.rating ?? 5,
    text:
      review.text?.text ??
      review.originalText?.text ??
      "Misafir yorumu Google üzerinden alınmıştır.",
    relativeTime: review.relativePublishTimeDescription,
    profilePhotoUrl: review.authorAttribution?.photoUri,
    publishTime: review.publishTime
  } as unknown as Review;
}

async function findGooglePlaceByBusinessName(apiKey: string): Promise<GooglePlace | null> {
  const query = process.env.GOOGLE_BUSINESS_NAME || "KULE SAPANCA Sapanca";

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.rating",
        "places.userRatingCount",
        "places.googleMapsUri"
      ].join(",")
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "tr",
      regionCode: "TR"
    }),
    next: {
      revalidate: 60 * 60 * 24
    }
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as GoogleTextSearchResponse;

  return data.places?.[0] ?? null;
}

async function getGooglePlaceDetails(apiKey: string, placeId: string): Promise<GooglePlace | null> {
  const response = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}?languageCode=tr`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
          "id",
          "displayName",
          "rating",
          "userRatingCount",
          "googleMapsUri",
          "reviews"
        ].join(",")
      },
      next: {
        revalidate: 60 * 60 * 6
      }
    }
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as GooglePlace;
}

export async function getGoogleBusinessReviews(): Promise<GoogleBusinessReviewsPayload> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return FALLBACK_GOOGLE_REVIEWS;
  }

  try {
    const foundPlace = await findGooglePlaceByBusinessName(apiKey);

    if (!foundPlace?.id) {
      return FALLBACK_GOOGLE_REVIEWS;
    }

    const details = await getGooglePlaceDetails(apiKey, foundPlace.id);

    if (!details) {
      return {
        businessName: foundPlace.displayName?.text ?? FALLBACK_GOOGLE_REVIEWS.businessName,
        rating: foundPlace.rating ?? FALLBACK_GOOGLE_REVIEWS.rating,
        reviewCount: foundPlace.userRatingCount ?? FALLBACK_GOOGLE_REVIEWS.reviewCount,
        url: foundPlace.googleMapsUri ?? process.env.GOOGLE_BUSINESS_REVIEW_URL ?? "",
        reviews: FALLBACK_GOOGLE_REVIEWS.reviews
      };
    }

    return {
      businessName: details.displayName?.text ?? foundPlace.displayName?.text ?? "KULE SAPANCA",
      rating: details.rating ?? foundPlace.rating ?? FALLBACK_GOOGLE_REVIEWS.rating,
      reviewCount:
        details.userRatingCount ??
        foundPlace.userRatingCount ??
        FALLBACK_GOOGLE_REVIEWS.reviewCount,
      url:
        details.googleMapsUri ??
        foundPlace.googleMapsUri ??
        process.env.GOOGLE_BUSINESS_REVIEW_URL ??
        "",
      reviews: details.reviews?.length
        ? details.reviews.map(normalizeGoogleReview)
        : FALLBACK_GOOGLE_REVIEWS.reviews
    };
  } catch {
    return FALLBACK_GOOGLE_REVIEWS;
  }
}
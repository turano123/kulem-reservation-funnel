import { getGoogleReviews } from "./integrations/googleReviews";

export async function getReviewsForProperty(propertySlug: string) {
  return getGoogleReviews(propertySlug);
}

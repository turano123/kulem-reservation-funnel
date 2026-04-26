import { notFound } from "next/navigation";
import { PremiumPropertyDetailPro } from "@/components/PremiumPropertyDetailPro";
import { getPropertyBySlug } from "@/lib/properties";
import { getGoogleBusinessReviews } from "@/lib/integrations/googleReviews";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PropertyDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const property = await getPropertyBySlug(slug);

  if (!property) {
    notFound();
  }

  const googleBusiness = await getGoogleBusinessReviews();

  return (
    <PremiumPropertyDetailPro
      property={{
        ...property,
        googleBusinessName: googleBusiness.businessName,
        googleRating: googleBusiness.rating,
        googleReviewCount: googleBusiness.reviewCount,
        googleReviewUrl: googleBusiness.url
      }}
      reviews={googleBusiness.reviews}
    />
  );
}
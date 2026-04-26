import { PremiumHomePagePro } from "@/components/PremiumHomePagePro";
import { getPropertyCardMetaMap } from "../lib/get-property-card-meta";
import { getAllProperties } from "../lib/properties";
import type { Property } from "../lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const properties = await getAllProperties();
  const visibleProperties: Property[] = properties.slice(0, 3);

  const liveMetaMap = await getPropertyCardMetaMap(
    visibleProperties.map((property) => property.slug)
  );

  const defaultQuery = new URLSearchParams({
    mode: "exact",
    checkin: "2026-05-28",
    checkout: "2026-05-30",
    adults: "2",
    children: "0",
    breakfast: "false"
  }).toString();

  return (
    <PremiumHomePagePro
      properties={visibleProperties}
      liveMetaMap={liveMetaMap}
      defaultQuery={defaultQuery}
    />
  );
}
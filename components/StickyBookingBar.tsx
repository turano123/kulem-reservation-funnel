import Link from "next/link";
import { formatCurrency, formatDate, formatGuestSummary, nightsBetween } from "@/lib/format";
import { buildInfoMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import type { Property, SearchInput } from "@/lib/types";
import { ReserveButton } from "./ReserveButton";

export function StickyBookingBar({ property, search, shownPrice }: { property: Property; search: SearchInput; shownPrice?: number }) {
  const isExact = search.mode === "exact";
  const infoUrl = buildWhatsAppUrl(
    buildInfoMessage(
      property.name,
      isExact
        ? `${formatDate(search.checkin)} - ${formatDate(search.checkout)} için detaylı bilgi almak istiyorum.`
        : "Esnek tarih arayışıyla inceliyorum."
    )
  );

  return (
    <aside className="card sticky-panel">
      <div className="quote-box">
        <span className="kicker">{isExact ? "Seçilen Tarihler" : "Esnek Keşif"}</span>
        <h3>{shownPrice ? formatCurrency(shownPrice) : "Takvimden tarih seçin"}</h3>
        <p className="muted" style={{ marginTop: 6 }}>
          {isExact
            ? `${formatDate(search.checkin)} – ${formatDate(search.checkout)} · ${nightsBetween(search.checkin, search.checkout)} gece`
            : "Henüz kesin tarih seçilmedi."}
        </p>
        <p className="muted tiny" style={{ marginTop: 6 }}>{formatGuestSummary(search.adults, search.children)}</p>
        <hr className="soft" />
        <div className="card-actions">
          {isExact ? (
            <ReserveButton
              payload={{
                propertySlug: property.slug,
                propertyName: property.name,
                mode: search.mode,
                checkin: search.checkin,
                checkout: search.checkout,
                adults: search.adults,
                children: search.children,
                childAges: search.childAges,
                shownPrice
              }}
              disabled={!shownPrice}
            />
          ) : (
            <Link href="#takvim" className="button-secondary">Takvimden Tarih Seç</Link>
          )}
          <Link href={infoUrl} className="button-ghost">WhatsApp ile Sor</Link>
        </div>
      </div>
      <div className="spacer-24" />
      <div className="surface" style={{ padding: 18 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <strong>Google Güveni</strong>
          <span className="chip">⭐ {property.reviewScore}</span>
        </div>
        <p className="muted" style={{ marginBottom: 0 }}>
          {property.reviewCount} yorum · tanıdık, güven veren ve WhatsApp kapanışlı akış.
        </p>
      </div>
    </aside>
  );
}

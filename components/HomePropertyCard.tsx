import Link from "next/link";
import type { Property, PropertyLiveCardMeta } from "../lib/types";
import { formatCurrency, formatDate } from "../lib/format";

type Props = {
  property: Property;
  queryString: string;
  liveCardMeta?: PropertyLiveCardMeta;
  priorityLabel?: string;
};

type IconName =
  | "heart"
  | "star"
  | "users"
  | "bed"
  | "pool"
  | "bath"
  | "fire"
  | "leaf"
  | "coffee"
  | "calendar"
  | "sparkles"
  | "camera"
  | "shield"
  | "arrow";

const EXTRA_GUEST_DAILY_FEE = 500;

function PremiumIcon({ name }: { name: IconName }) {
  const commonProps = {
    className: "home-property-premium-icon",
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    fill: "none"
  } as const;

  if (name === "heart") {
    return (
      <svg {...commonProps}>
        <path
          d="M12 20.4s-7.3-4.2-9.3-9.2C1.4 8 3.4 5 6.6 5c1.9 0 3.4 1 4.2 2.3C11.6 6 13.1 5 15 5c3.2 0 5.2 3 3.9 6.2-2 5-9.3 9.2-9.3 9.2Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "star") {
    return (
      <svg {...commonProps}>
        <path
          d="m12 3.4 2.5 5.1 5.6.8-4.1 4 1 5.6-5-2.6-5 2.6 1-5.6-4.1-4 5.6-.8L12 3.4Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "users") {
    return (
      <svg {...commonProps}>
        <path
          d="M8.6 11.3a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM2.8 20c.5-3.3 2.7-5.5 5.8-5.5s5.3 2.2 5.8 5.5M16 11.3a3 3 0 1 0-.8-5.8M15.8 14.6c2.7.2 4.6 2.2 5.1 5.4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "bed") {
    return (
      <svg {...commonProps}>
        <path
          d="M4 19V8.8M20 19v-5.2a3 3 0 0 0-3-3H4M4 15.2h16M7.2 10.8V8.5c0-.9.7-1.6 1.6-1.6h2.5c.9 0 1.6.7 1.6 1.6v2.3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "pool") {
    return (
      <svg {...commonProps}>
        <path
          d="M4 15.3c1.4 0 1.4 1 2.8 1s1.4-1 2.8-1 1.4 1 2.8 1 1.4-1 2.8-1 1.4 1 2.8 1 1.4-1 2.8-1M4 19c1.4 0 1.4 1 2.8 1s1.4-1 2.8-1 1.4 1 2.8 1 1.4-1 2.8-1 1.4 1 2.8 1 1.4-1 2.8-1"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <path
          d="M8 13V5.8A2.8 2.8 0 0 1 10.8 3h.4A2.8 2.8 0 0 1 14 5.8V7"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "bath") {
    return (
      <svg {...commonProps}>
        <path
          d="M5 11.5V6.7A2.7 2.7 0 0 1 7.7 4h.4a2.7 2.7 0 0 1 2.7 2.7v.4M4 12h16v2.8a5.2 5.2 0 0 1-5.2 5.2H9.2A5.2 5.2 0 0 1 4 14.8V12Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.5 7.8h4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "fire") {
    return (
      <svg {...commonProps}>
        <path
          d="M12.1 21c-3.5 0-6.1-2.4-6.1-5.8 0-2.7 1.7-4.6 3.4-6.3 1.4-1.4 2.2-2.8 2-5.1 2.7 1.5 5.4 4.3 4.5 8.1 1-.5 1.6-1.4 1.9-2.4 1.3 1.4 2.2 3.2 2.2 5.5 0 3.5-2.6 6-7.9 6Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "leaf") {
    return (
      <svg {...commonProps}>
        <path
          d="M20.4 4.1C12.1 4.2 5.2 8.3 5.2 15.1c0 3.2 2.2 5.2 5.1 5.2 6.5 0 9.8-7.5 10.1-16.2Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 20.5c3.6-5.7 7.6-8.9 12.1-10.8"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "coffee") {
    return (
      <svg {...commonProps}>
        <path
          d="M6 8h10v5.5A4.5 4.5 0 0 1 11.5 18h-1A4.5 4.5 0 0 1 6 13.5V8Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 10h1.2a2.2 2.2 0 0 1 0 4.4H16M8 4.2v1.2M11 4.2v1.2M14 4.2v1.2M5 20h13"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "calendar") {
    return (
      <svg {...commonProps}>
        <path
          d="M7 3.8v3M17 3.8v3M4.8 9.2h14.4M6.5 5.5h11c1.4 0 2.5 1.1 2.5 2.5v10.2c0 1.4-1.1 2.5-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.2V8c0-1.4 1.1-2.5 2.5-2.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "sparkles") {
    return (
      <svg {...commonProps}>
        <path
          d="M12 2.9 13.8 8l5.3 1.9-5.3 1.9L12 17l-1.8-5.2-5.3-1.9L10.2 8 12 2.9ZM19.2 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2ZM5.2 15.2l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z"
          stroke="currentColor"
          strokeWidth="1.55"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "camera") {
    return (
      <svg {...commonProps}>
        <path
          d="M8.7 6.2 10 4.5h4l1.3 1.7H18a3 3 0 0 1 3 3v7.3a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V9.2a3 3 0 0 1 3-3h2.7Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 15.8a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (name === "shield") {
    return (
      <svg {...commonProps}>
        <path
          d="M12 3.2 19.2 6v5.7c0 4.7-3 7.9-7.2 9.1-4.2-1.2-7.2-4.4-7.2-9.1V6L12 3.2Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m8.8 12.2 2.1 2.1 4.5-4.7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getBaseGuestCount(slug: string) {
  return slug === "kule-deluxe" ? 4 : 2;
}

function getBaseGuestLabel(slug: string) {
  return `${getBaseGuestCount(slug)} kişi baz fiyat`;
}

function getCapacityLabel(property: Property) {
  return property.maxGuests ? `${property.maxGuests} kişi` : "Kişi bilgisi";
}

function getExperienceChips(property: Property) {
  const chips: Array<{ icon: IconName; text: string }> = [
    { icon: "pool", text: "Özel Havuz" }
  ];

  if (property.slug === "kule-deluxe") {
    chips.push(
      { icon: "bath", text: "2 Jakuzi" },
      { icon: "fire", text: "Şömine" }
    );
  } else if (property.slug === "kule-suit") {
    chips.push(
      { icon: "bath", text: "Jakuzi" },
      { icon: "fire", text: "Şömine" }
    );
  } else {
    chips.push(
      { icon: "bath", text: "Jakuzi" },
      { icon: "leaf", text: "Doğa" }
    );
  }

  return chips;
}

function getBreakfastLabel(property: Property) {
  if (property.breakfastMode === "dahil") return "Kahvaltı Dahil";
  if (property.breakfastMode === "hariç") return "Kahvaltı Hariç";
  return "Kahvaltı Opsiyonel";
}

function getImageCount(property: Property) {
  const galleryCount = property.gallery?.length ?? 0;
  return Math.max(1, galleryCount + (property.heroImage ? 1 : 0));
}

export function HomePropertyCard({
  property,
  queryString,
  liveCardMeta,
  priorityLabel = "Premium"
}: Props) {
  const fallbackStartingPrice = Math.min(
    property.rates.weekday,
    property.rates.weekend
  );

  const sheetStartingPrice =
    liveCardMeta?.currentYearBestPrice ??
    liveCardMeta?.firstAvailablePrice ??
    null;

  const startingPrice = sheetStartingPrice ?? fallbackStartingPrice;

  const bestPriceDate =
    liveCardMeta?.currentYearBestPriceDate ??
    liveCardMeta?.firstAvailableDate ??
    null;

  const firstAvailableDate = liveCardMeta?.firstAvailableDate ?? null;
  const breakfastLabel = getBreakfastLabel(property);
  const chips = getExperienceChips(property);
  const reviewScore = property.reviewScore ?? 4.9;
  const imageCount = getImageCount(property);
  const baseGuestCount = getBaseGuestCount(property.slug);

  return (
    <Link
      href={`/properties/${property.slug}?${queryString}`}
      className="home-ultra-property-card home-premium-property-card"
      aria-label={`${property.name} detaylarını gör`}
    >
      <div className="home-ultra-property-cover home-premium-property-cover">
        <img
          src={property.heroImage}
          alt={property.name}
          loading="lazy"
        />

        <div className="home-ultra-property-cover-shade home-premium-property-cover-shade" />

        <div className="home-premium-property-topline">
          <span className="home-ultra-property-badge home-premium-property-badge">
            <PremiumIcon name="sparkles" />
            {priorityLabel}
          </span>

          <span className="home-ultra-property-save home-premium-property-save" aria-hidden="true">
            <PremiumIcon name="heart" />
          </span>
        </div>

        <div className="home-premium-property-cover-bottom">
          <div className="home-ultra-property-score home-premium-property-score">
            <PremiumIcon name="star" />
            <strong>{reviewScore.toFixed(1)}</strong>
            <span>Google</span>
          </div>

          <div className="home-premium-property-photo-count">
            <PremiumIcon name="camera" />
            <span>{imageCount} fotoğraf</span>
          </div>
        </div>
      </div>

      <div className="home-ultra-property-body home-premium-property-body">
        <div className="home-ultra-property-title-row home-premium-property-title-row">
          <div>
            <span className="home-premium-property-location">
              <PremiumIcon name="shield" />
              Doğrudan işletme güvencesi
            </span>

            <h3>{property.name}</h3>

            <p>{property.tagline}</p>
          </div>
        </div>

        <div className="home-ultra-property-meta home-premium-property-meta">
          <span>
            <PremiumIcon name="bed" />
            {property.layout}
          </span>

          <span>
            <PremiumIcon name="users" />
            {getCapacityLabel(property)}
          </span>

          <span>
            <PremiumIcon name="coffee" />
            {breakfastLabel}
          </span>
        </div>

        <div className="home-ultra-property-chips home-premium-property-chips">
          {chips.map((chip) => (
            <span key={chip.text}>
              <PremiumIcon name={chip.icon} />
              {chip.text}
            </span>
          ))}
        </div>

        <div className="home-ultra-property-price-area home-premium-property-price-area">
          <div className="home-premium-price-copy">
            {bestPriceDate ? (
              <p className="home-ultra-property-date home-premium-property-date">
                <PremiumIcon name="calendar" />
                En uygun tarih: <strong>{formatDate(bestPriceDate)}</strong>
              </p>
            ) : (
              <p className="home-ultra-property-date home-premium-property-date">
                <PremiumIcon name="calendar" />
                Gecelik başlangıç
              </p>
            )}

            {firstAvailableDate && bestPriceDate !== firstAvailableDate ? (
              <p className="home-ultra-property-date muted home-premium-property-date muted">
                En yakın uygun: <strong>{formatDate(firstAvailableDate)}</strong>
              </p>
            ) : null}

            <div className="home-ultra-price-line home-premium-price-line">
              <strong>{formatCurrency(startingPrice)}</strong>
              <span>/ gece</span>
            </div>

            <small>
              {getBaseGuestLabel(property.slug)} · Ek kişi gecelik{" "}
              {formatCurrency(EXTRA_GUEST_DAILY_FEE)}
            </small>

            <em>
              Baz fiyat {baseGuestCount} kişiye kadar geçerlidir.
            </em>
          </div>

          <span className="home-ultra-details-button home-premium-details-button">
            <span>Detayları İncele</span>
            <PremiumIcon name="arrow" />
          </span>
        </div>
      </div>
    </Link>
  );
}
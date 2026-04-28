import Link from "next/link";
import { parseSearchParams } from "@/lib/parse-search";
import { searchProperties } from "@/lib/search";
import { durationOptions, monthOptions } from "@/lib/mock-data";
import {
  formatCurrency,
  formatDate,
  formatGuestSummary,
  nightsBetween
} from "@/lib/format";
import styles from "./page.module.css";

type ResultsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

type SearchMode = "exact" | "flexible" | string;

type ResultQuote = {
  total?: number;
  totalFormatted?: string;
  totalPrice?: number;
  subtotal?: number;
  grandTotal?: number;
  nightlyAverage?: number;
  nights?: number;
};

type ResultItem = {
  status: "available" | "unavailable" | string;
  label?: string;
  reason?: string;
  reasonCode?: string;
  totalPrice?: number;
  startingPrice?: number;
  quote?: ResultQuote;
  suggestion?: {
    checkin?: string;
    checkout?: string;
  };
  property: {
    slug: string;
    name: string;
    tagline?: string;
    summary?: string;
    heroImage?: string;
    maxGuests?: number;
    layout?: string;
    breakfastMode?: "dahil" | "hariç" | "opsiyonel" | string;
    rates?: {
      weekday?: number;
      weekend?: number;
    };
  };
};

type PriceDisplay = {
  text: string;
  source: "live-total" | "live-starting" | "formatted" | "missing";
};

function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function getBreakfastLabel(property: ResultItem["property"]) {
  if (property.breakfastMode === "dahil") return "Kahvaltı Dahil";
  if (property.breakfastMode === "hariç") return "Kahvaltı Hariç";
  return "Kahvaltı Opsiyonel";
}

function buildPropertyHref(item: ResultItem, search: any) {
  const params = new URLSearchParams();

  params.set("mode", search.mode ?? "exact");

  if (search.checkin) params.set("checkin", search.checkin);
  if (search.checkout) params.set("checkout", search.checkout);

  if (search.adults !== undefined) params.set("adults", String(search.adults));
  if (search.children !== undefined) params.set("children", String(search.children));

  if (search.breakfast !== undefined) {
    params.set("breakfast", String(Boolean(search.breakfast)));
  }

  if (Array.isArray(search.childAges) && search.childAges.length) {
    params.set("childAges", search.childAges.join(","));
  } else if (typeof search.childAges === "string" && search.childAges) {
    params.set("childAges", search.childAges);
  }

  if (search.monthLabel) params.set("monthLabel", search.monthLabel);
  if (search.durationLabel) params.set("durationLabel", search.durationLabel);

  const price = resolvePrice(item, search.mode ?? "exact");
  if (price.source !== "missing") {
    const rawNumeric =
      item.totalPrice ??
      item.quote?.total ??
      item.quote?.totalPrice ??
      item.quote?.grandTotal ??
      item.quote?.subtotal ??
      item.startingPrice;

    if (isValidNumber(rawNumeric)) {
      params.set("shownPrice", String(rawNumeric));
    }
  }

  return `/properties/${item.property.slug}`;
}

function resolvePrice(item: ResultItem, mode: SearchMode): PriceDisplay {
  const quote = item.quote;

  if (quote?.totalFormatted) {
    return {
      text: quote.totalFormatted,
      source: "formatted"
    };
  }

  if (mode === "exact") {
    const exactTotal =
      item.totalPrice ??
      quote?.total ??
      quote?.totalPrice ??
      quote?.grandTotal ??
      quote?.subtotal;

    if (isValidNumber(exactTotal)) {
      return {
        text: formatCurrency(exactTotal),
        source: "live-total"
      };
    }

    return {
      text: "Fiyat doğrulanıyor",
      source: "missing"
    };
  }

  const flexiblePrice =
    item.startingPrice ??
    quote?.total ??
    quote?.totalPrice ??
    quote?.grandTotal ??
    quote?.subtotal ??
    quote?.nightlyAverage;

  if (isValidNumber(flexiblePrice)) {
    return {
      text: formatCurrency(flexiblePrice),
      source: "live-starting"
    };
  }

  return {
    text: "Fiyat doğrulanıyor",
    source: "missing"
  };
}

function getPriceCaption(item: ResultItem, search: any, price: PriceDisplay) {
  if (price.source === "missing") {
    return "Canlı fiyat verisi gelmediği için kartta tahmini fiyat göstermiyoruz.";
  }

  if (search.mode === "exact") {
    const nights = item.quote?.nights ?? nightsBetween(search.checkin, search.checkout);
    return `${nights} gece toplam canlı fiyat`;
  }

  return "Canlı başlangıç fiyatı";
}

function ResultPropertyCard({
  item,
  search
}: {
  item: ResultItem;
  search: any;
}) {
  const property = item.property;
  const isAvailable = item.status === "available";
  const price = resolvePrice(item, search.mode);

  return (
    <Link
      href={buildPropertyHref(item, search)}
      className={styles.cardLink}
      aria-label={`${property.name} detaylarını gör`}
    >
      <article className={`${styles.card} ${!isAvailable ? styles.cardMuted : ""}`}>
        <div className={styles.cover}>
          {property.heroImage ? (
            <img src={property.heroImage} alt={property.name} loading="lazy" />
          ) : (
            <div className={styles.coverPlaceholder} />
          )}

          <div className={styles.coverShade} />

          <div className={styles.coverTop}>
            <span
              className={`${styles.badge} ${
                isAvailable ? styles.badgeAvailable : styles.badgeUnavailable
              }`}
            >
              {isAvailable ? "Müsait" : "Uygun Değil"}
            </span>

            <span className={styles.photoPill}>Canlı Veri</span>
          </div>
        </div>

        <div className={styles.cardBody}>
          <div className={styles.titleRow}>
            <h3>{property.name}</h3>
            <p>{property.tagline || property.summary || "Premium villa deneyimi."}</p>
          </div>

          <div className={styles.meta}>
            {property.maxGuests ? <span>{property.maxGuests} kişi</span> : null}
            {property.layout ? <span>{property.layout}</span> : null}
            <span>{getBreakfastLabel(property)}</span>
          </div>

          <div className={styles.priceArea}>
            {isAvailable ? (
              <>
                <span className={styles.priceLabel}>
                  {search.mode === "exact" ? "Seçilen tarihler için" : "Başlayan fiyat"}
                </span>
                <strong>{price.text}</strong>
                <small>{getPriceCaption(item, search, price)}</small>
              </>
            ) : (
              <>
                <span className={styles.priceLabel}>Bu aramada uygun değil</span>
                <p>{item.reason || item.reasonCode || "Farklı tarih deneyebilirsiniz."}</p>
              </>
            )}
          </div>

          <span className={styles.action}>
            {isAvailable ? "Detayları İncele" : "Alternatif Tarih Bak"}
          </span>
        </div>
      </article>
    </Link>
  );
}

export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const resolved = await searchParams;
  const search = parseSearchParams(resolved);
  const results = (await searchProperties(search)) as ResultItem[];

  const searchChips =
    search.mode === "exact"
      ? [
          `${formatDate(search.checkin)} – ${formatDate(search.checkout)}`,
          `${nightsBetween(search.checkin, search.checkout)} gece`,
          formatGuestSummary(search.adults, search.children),
          search.breakfast ? "Kahvaltı dahil" : "Kahvaltı hariç"
        ]
      : [
          monthOptions.find((item) => item.value === search.monthLabel)?.label ??
            search.monthLabel,
          durationOptions.find((item) => item.value === search.durationLabel)?.label ??
            search.durationLabel,
          formatGuestSummary(search.adults, search.children)
        ];

  const available = results.filter((item) => item.status === "available");
  const unavailable = results.filter((item) => item.status === "unavailable");

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.container}>
          <Link className={styles.backButton} href="/">
            ← Yeni Arama
          </Link>

          <span className={styles.eyebrow}>Kule Sapanca canlı sonuç</span>

          <div className={styles.head}>
            <div>
              <h1>
                {search.mode === "exact"
                  ? "Bu tarihlerde uygun evler"
                  : "Sizin için uygun dönemler ve evler"}
              </h1>

              <p>
                {search.mode === "exact"
                  ? "Kartlarda yalnızca canlı arama sonucundan gelen toplam fiyat gösterilir."
                  : "Esnek aramanıza göre önerilen dönemler ve başlayan fiyatlar."}
              </p>
            </div>
          </div>

          <div className={styles.chipRow}>
            {searchChips.map((chip) => (
              <span className={styles.chip} key={chip}>
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className={`${styles.container} ${styles.results}`}>
        {available.length ? (
          <div className={styles.grid}>
            {available.map((item) => (
              <ResultPropertyCard
                key={item.property.slug}
                item={item}
                search={search}
              />
            ))}
          </div>
        ) : (
          <div className={styles.empty}>
            <h3>Bu kriterlerle şu anda net uygun sonuç bulunamadı.</h3>
            <p>Takvimden yeni dönem seçebilir ya da WhatsApp üzerinden kombinasyon sorabilirsiniz.</p>

            <Link href="/" className={styles.emptyButton}>
              Aramayı Güncelle
            </Link>
          </div>
        )}

        {unavailable.length ? (
          <section className={styles.secondary}>
            <div className={styles.secondaryHead}>
              <span>Alternatifler</span>
              <h2>Bu aramada öne çıkmayan evler</h2>
              <p>Müsait olmayan evleri de listede tutuyoruz; farklı tarih deneyebilirsiniz.</p>
            </div>

            <div className={styles.grid}>
              {unavailable.map((item) => (
                <ResultPropertyCard
                  key={item.property.slug}
                  item={item}
                  search={search}
                />
              ))}
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Property } from "@/lib/types";
import { ReserveButton } from "./ReserveButton";

type SheetDay = {
  date: string;
  status: string;
  price: number;
};

type PropertyWithSheetRows = Property & {
  sheetRows?: SheetDay[];
  googleBusinessName?: string;
  googleRating?: number;
  googleReviewCount?: number;
  googleReviewUrl?: string;
};

type Props = {
  property: PropertyWithSheetRows;
  reviews: unknown[];
};

type FeatureGroup = "Konfor" | "Keyif" | "Aile Dostu" | "Olanaklar";

type FeatureItem = {
  icon: string;
  text: string;
  group: FeatureGroup;
};

type CalendarDay = {
  date: string;
  day: number | null;
};

type ReviewInput = {
  id?: string | number;
  authorName?: string;
  name?: string;
  text?: string;
  comment?: string;
  body?: string;
  rating?: number;
  relativeTime?: string;
  profilePhotoUrl?: string;
  publishTime?: string;
};

type DisplayReview = {
  id: string;
  authorName: string;
  rating: number;
  text: string;
  relativeTime?: string;
  profilePhotoUrl?: string;
  publishTime?: string;
};

const featureGroups: FeatureGroup[] = ["Konfor", "Keyif", "Aile Dostu", "Olanaklar"];
const weekdays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const fallbackHeroImage = "/uploads/kule-suit-dron.jpg";

const BASE_GUEST_LIMIT_BY_SLUG: Record<string, number> = {
  "kule-yesil-ev": 2,
  "kule-suit": 2,
  "kule-deluxe": 4
};

const EXTRA_GUEST_DAILY_FEE = 500;

type SelectedPriceRow = {
  date: string;
  basePrice: number;
  extraGuestFee: number;
  totalPrice: number;
};

const propertyFeatures: Record<string, FeatureItem[]> = {
  "kule-deluxe": [
    { icon: "👥", text: "Max 8 kişi", group: "Aile Dostu" },
    { icon: "🏊", text: "Özel havuz 3x6 m / 145 cm", group: "Keyif" },
    { icon: "🛁", text: "2 adet jakuzi", group: "Keyif" },
    { icon: "🔥", text: "Doğalgaz şöminesi", group: "Keyif" },
    { icon: "🔥", text: "Kış bahçesi odun şöminesi", group: "Keyif" },
    { icon: "🅿️", text: "Özel otopark", group: "Olanaklar" },
    { icon: "🛏️", text: "2 jakuzili ebeveyn banyolu yatak odası + 1 standart yatak odası", group: "Konfor" },
    { icon: "🛋️", text: "1 oturma odası", group: "Konfor" },
    { icon: "🧸", text: "Park bebek yatağı (0-3 yaş)", group: "Aile Dostu" },
    { icon: "☕", text: "Sabah kahvaltısı", group: "Olanaklar" },
    { icon: "📺", text: "Akıllı TV / Netflix", group: "Konfor" },
    { icon: "📶", text: "Yüksek hızlı internet", group: "Konfor" },
    { icon: "🥩", text: "Barbekü alanı", group: "Olanaklar" },
    { icon: "🏡", text: "300 m² bahçeli kullanım alanı", group: "Aile Dostu" },
    { icon: "🌿", text: "Göl ve doğa manzaralı", group: "Keyif" },
    { icon: "📍", text: "Sapanca merkeze 10 dakika", group: "Olanaklar" }
  ],
  "kule-suit": [
    { icon: "👥", text: "Max 4 kişi", group: "Aile Dostu" },
    { icon: "🏊", text: "Özel havuz 3x6 m / 145 cm", group: "Keyif" },
    { icon: "🛁", text: "4 kişilik dış mekan jakuzi", group: "Keyif" },
    { icon: "🔥", text: "Doğalgaz şöminesi", group: "Keyif" },
    { icon: "🅿️", text: "Özel otopark", group: "Olanaklar" },
    { icon: "🛏️", text: "1 yatak odası", group: "Konfor" },
    { icon: "🛋️", text: "1 oturma odası", group: "Konfor" },
    { icon: "🧸", text: "Park bebek yatağı", group: "Aile Dostu" },
    { icon: "☕", text: "Sabah kahvaltısı", group: "Olanaklar" },
    { icon: "📺", text: "Akıllı TV / Netflix", group: "Konfor" },
    { icon: "📶", text: "İnternet", group: "Konfor" },
    { icon: "🥩", text: "Barbekü", group: "Olanaklar" },
    { icon: "🌿", text: "Doğa manzaralı", group: "Keyif" },
    { icon: "📍", text: "Sapanca merkeze 10 dakika", group: "Olanaklar" }
  ],
  "kule-yesil-ev": [
    { icon: "👥", text: "Max 4 kişi", group: "Aile Dostu" },
    { icon: "🏊", text: "Özel havuz 3 m daire", group: "Keyif" },
    { icon: "🛁", text: "Jakuzi", group: "Keyif" },
    { icon: "🔥", text: "Doğalgaz şöminesi", group: "Keyif" },
    { icon: "🅿️", text: "Özel otopark", group: "Olanaklar" },
    { icon: "🛏️", text: "1 yatak odası", group: "Konfor" },
    { icon: "🛋️", text: "1 oturma odası", group: "Konfor" },
    { icon: "🧸", text: "Park bebek yatağı", group: "Aile Dostu" },
    { icon: "☕", text: "Sabah kahvaltısı", group: "Olanaklar" },
    { icon: "📺", text: "Akıllı TV / Netflix", group: "Konfor" },
    { icon: "📶", text: "İnternet", group: "Konfor" },
    { icon: "🥩", text: "Barbekü", group: "Olanaklar" },
    { icon: "🌿", text: "Doğa manzaralı", group: "Keyif" },
    { icon: "📍", text: "Sapanca merkeze 10 dakika", group: "Olanaklar" }
  ]
};

function getFeatures(property: Property): FeatureItem[] {
  return (
    propertyFeatures[property.slug] ??
    (property.amenities ?? []).map((text) => ({
      icon: "✓",
      text,
      group: "Olanaklar"
    }))
  );
}

function getBaseGuestLimit(property: PropertyWithSheetRows) {
  return BASE_GUEST_LIMIT_BY_SLUG[property.slug] ?? 2;
}

function getTotalGuestCount(adults: number, children: number) {
  return Math.max(0, adults) + Math.max(0, children);
}

function getExtraGuestCount(property: PropertyWithSheetRows, adults: number, children: number) {
  // 0-12 yaş çocuklar kapasiteye dahil edilir ama ek kişi ücretine dahil edilmez.
  void children;

  return Math.max(0, Math.max(0, adults) - getBaseGuestLimit(property));
}

function getExtraGuestDailyFee(property: PropertyWithSheetRows, adults: number, children: number) {
  return getExtraGuestCount(property, adults, children) * EXTRA_GUEST_DAILY_FEE;
}

function toDate(value: string) {
  return new Date(`${value}T12:00:00`);
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeStatus(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace("Ş", "S");
}

function isBusyStatus(status?: string) {
  const value = normalizeStatus(status);
  return value === "DOLU" || value === "PENDING" || value === "BEKLEMEDE";
}

function hasBusyNightBetween(startDate: string, endDate: string, sheetDayMap: Map<string, SheetDay>) {
  const current = new Date(toDate(startDate));
  const end = toDate(endDate);

  while (current < end) {
    const key = toInputDate(current);
    const dayData = sheetDayMap.get(key);

    if (isBusyStatus(dayData?.status)) {
      return true;
    }

    current.setDate(current.getDate() + 1);
  }

  return false;
}

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  if (!value) return "";
  return new Intl.DateTimeFormat(
    "tr-TR",
    options ?? {
      day: "numeric",
      month: "long",
      year: "numeric"
    }
  ).format(toDate(value));
}

function formatPrice(price?: number) {
  if (!price || price <= 0) return "";
  return new Intl.NumberFormat("tr-TR").format(price);
}

function getNightCount(checkin: string, checkout: string) {
  if (!checkin || !checkout) return 0;
  const diff = toDate(checkout).getTime() - toDate(checkin).getTime();
  return Math.max(0, Math.round(diff / 86400000));
}

function addDaysToInputDate(date: string, days: number) {
  const next = new Date(toDate(date));
  next.setDate(next.getDate() + days);

  return toInputDate(next);
}

function isSheetNightAvailable(date: string, sheetDayMap: Map<string, SheetDay>) {
  const dayData = sheetDayMap.get(date);

  if (!dayData) {
    return false;
  }

  return !isBusyStatus(dayData.status);
}

function getStayRuleMessage(checkin: string, checkout: string, sheetDayMap: Map<string, SheetDay>) {
  const nights = getNightCount(checkin, checkout);

  if (!checkin || !checkout || nights <= 0) {
    return "";
  }

  // Sadece tek gece seçimlerde hafta sonu parçalama kontrolü yapılır.
  if (nights !== 1) {
    return "";
  }

  const checkinDay = toDate(checkin).getDay();

  // JS günleri: Pazar 0, Pazartesi 1, Cuma 5, Cumartesi 6
  const isFridayNight = checkinDay === 5;
  const isSaturdayNight = checkinDay === 6;
  const isSundayNight = false; // Pazar gecesi hafta içi kabul edilir.

  const previousNight = addDaysToInputDate(checkin, -1);
  const nextNight = addDaysToInputDate(checkin, 1);

  const previousNightAvailable = isSheetNightAvailable(previousNight, sheetDayMap);
  const nextNightAvailable = isSheetNightAvailable(nextNight, sheetDayMap);

  if (isFridayNight && nextNightAvailable) {
    return "Cuma gecesi tek gece olarak ayrılamıyor. Cumartesi gecesi de müsait olduğu için hafta sonu minimum 2 gece seçim yapılmalıdır.";
  }

  if (isSaturdayNight && (previousNightAvailable || nextNightAvailable)) {
    return "Cumartesi gecesi tek gece olarak ayrılamıyor. Cuma veya Pazar gecesiyle 2 gecelik hafta sonu konaklaması yapılabildiği için minimum 2 gece seçim yapılmalıdır.";
  }

  // Yanındaki hafta sonu gecesi doluysa tek gece satışa izin verilir.
  return "";
}
function getCalendarDays(year: number, month: number): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const days: CalendarDay[] = [];

  for (let i = 0; i < startOffset; i += 1) {
    days.push({ date: "", day: null });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    days.push({
      date: toInputDate(new Date(year, month, day)),
      day
    });
  }

  return days;
}

function asReviewInput(review: unknown): ReviewInput {
  if (review && typeof review === "object") {
    return review as ReviewInput;
  }

  return {};
}

function normalizeReview(review: unknown, index: number): DisplayReview {
  const item = asReviewInput(review);
  const fallbackNames = ["Ahmet K.", "Burcu Y.", "Mehmet T.", "Elif A."];
  const authorName = item.authorName || item.name || fallbackNames[index % fallbackNames.length];

  return {
    id: String(item.id ?? `${authorName}-${index}`),
    authorName,
    rating: Math.max(1, Math.min(5, Number(item.rating ?? 5))),
    text:
      item.text ||
      item.comment ||
      item.body ||
      "Konum, temizlik ve işletme ilgisi çok güzeldi. Ailemizle keyifli bir konaklama geçirdik.",
    relativeTime: item.relativeTime,
    profilePhotoUrl: item.profilePhotoUrl,
    publishTime: item.publishTime
  };
}

const hiddenReviewAuthorKeys = new Set(["betul urkmez"]);

function normalizeReviewAuthorKey(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ğ/g, "g")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ")
    .trim();
}

function isHiddenReviewAuthor(authorName: string) {
  return hiddenReviewAuthorKeys.has(normalizeReviewAuthorKey(authorName));
}

function clampReviews(reviews: unknown[]): DisplayReview[] {
  const fallbackReviews: DisplayReview[] = [
    {
      id: "fallback-google-1",
      authorName: "Google Misafiri",
      rating: 5,
      text: "Ev çok temizdi, havuz ve jakuzi harikaydı. Aileyle rahat ettik."
    },
    {
      id: "fallback-google-2",
      authorName: "Google Misafiri",
      rating: 5,
      text: "Konum çok iyi, işletme hızlı dönüş yaptı. Tekrar geleceğiz."
    },
    {
      id: "fallback-google-3",
      authorName: "Google Misafiri",
      rating: 5,
      text: "Harika bir tatildi, her şey düşünülmüş. Teşekkürler."
    }
  ];

  const visibleReviews = reviews
    .map(normalizeReview)
    .filter((review) => !isHiddenReviewAuthor(review.authorName))
    .filter((review) => review.text.trim().length > 0);

  return [...visibleReviews, ...fallbackReviews].slice(0, 6);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function GoogleIcon() {
  return <span className="kule-pro-google-letter">G</span>;
}

export function PremiumPropertyDetailPro({ property, reviews }: Props) {
  const searchParams = useSearchParams();

  const allImages = useMemo(() => {
    const unique = new Set<string>();

    [property.heroImage, ...(property.gallery ?? [])]
      .filter(Boolean)
      .forEach((image) => unique.add(image));

    if (!unique.size) {
      unique.add(fallbackHeroImage);
    }

    return Array.from(unique);
  }, [property.heroImage, property.gallery]);

  const features = useMemo(() => getFeatures(property), [property]);
  const reviewItems = useMemo(() => clampReviews(reviews), [reviews]);

  const sheetDayMap = useMemo(() => {
    const map = new Map<string, SheetDay>();

    property.sheetRows?.forEach((row) => {
      if (row?.date) {
        map.set(row.date, row);
      }
    });

    return map;
  }, [property.sheetRows]);

  const [activeImage, setActiveImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

    function getSearchNumber(names: string[], fallback: number) {
    for (const name of names) {
      const rawValue = searchParams.get(name);

      if (rawValue !== null && rawValue !== "") {
        const value = Number(rawValue);

        if (Number.isFinite(value)) {
          return value;
        }
      }
    }

    return fallback;
  }

  const initialAdults = getSearchNumber(["adults", "adult", "guests", "guestCount"], 2);
  const initialChildren = getSearchNumber(["children", "child", "kids"], 0);
  const initialChildAges = (searchParams.get("childAges") ?? "")
    .split(",")
    .map((item) => Number(item))
    .filter((age) => Number.isFinite(age) && age >= 0 && age <= 12);

  const [checkin, setCheckin] = useState(searchParams.get("checkin") ?? "");
  const [checkout, setCheckout] = useState(searchParams.get("checkout") ?? "");
  const [adults, setAdults] = useState(Math.max(1, initialAdults || 2));
  const [children, setChildren] = useState(Math.max(0, initialChildren || 0));
  const [childAges, setChildAges] = useState<number[]>(initialChildAges);

  const initialDate = checkin ? toDate(checkin) : new Date();
  const [calendarYear, setCalendarYear] = useState(initialDate.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(initialDate.getMonth());

  const todayKey = toInputDate(new Date());
  const nights = getNightCount(checkin, checkout);
  const hasDateSelection = Boolean(checkin && checkout && nights > 0);

    // Çocuk seçimi 0-12 yaş kategorisidir; çocuklar ücretsizdir ve ek kişi ücretine dahil edilmez.
  const childAgesValid = true;

  const totalGuests = getTotalGuestCount(adults, children);
  const maxGuests = property.maxGuests ?? 99;
  const withinGuestLimit = totalGuests <= maxGuests;
  const baseGuestLimit = getBaseGuestLimit(property);
  const extraGuestCount = getExtraGuestCount(property, adults, children);
  const extraGuestDailyFee = getExtraGuestDailyFee(property, adults, children);

  const stayRuleMessage = getStayRuleMessage(checkin, checkout, sheetDayMap);
  const selectedDatesBlocked = hasDateSelection
    ? hasBusyNightBetween(checkin, checkout, sheetDayMap)
    : false;

  const canReserve =
    hasDateSelection &&
    adults > 0 &&
    childAgesValid &&
    withinGuestLimit &&
    !stayRuleMessage &&
    !selectedDatesBlocked;

  const monthLabel = new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric"
  }).format(new Date(calendarYear, calendarMonth, 1));

  const calendarDays = getCalendarDays(calendarYear, calendarMonth);

  const selectedRows: SelectedPriceRow[] = hasDateSelection
    ? Array.from({ length: nights }).map((_, index) => {
        const date = new Date(toDate(checkin));
        date.setDate(date.getDate() + index);

        const key = toInputDate(date);
        const basePrice = sheetDayMap.get(key)?.price ?? 0;

        return {
          date: key,
          basePrice,
          extraGuestFee: basePrice > 0 ? extraGuestDailyFee : 0,
          totalPrice: basePrice > 0 ? basePrice + extraGuestDailyFee : 0
        };
      })
    : [];

  const baseSubtotal = selectedRows.reduce((sum, row) => sum + (row.basePrice || 0), 0);
  const extraGuestTotal = selectedRows.reduce((sum, row) => sum + (row.extraGuestFee || 0), 0);
  const subtotal = selectedRows.reduce((sum, row) => sum + (row.totalPrice || 0), 0);
  const cleaningFee = 0;
  const total = subtotal + cleaningFee;

  const googleBusinessName = property.googleBusinessName ?? "KULE SAPANCA";
  const googleRating = property.googleRating ?? 4.9;
  const googleReviewCount = property.googleReviewCount ?? Math.max(254, reviews.length || 0);
  const activeImageSrc = allImages[activeImage] ?? allImages[0] ?? fallbackHeroImage;

  useEffect(() => {
    if (!galleryOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setGalleryOpen(false);
      if (event.key === "ArrowRight") {
        setActiveImage((current) => (current + 1) % allImages.length);
      }
      if (event.key === "ArrowLeft") {
        setActiveImage((current) => (current - 1 + allImages.length) % allImages.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [galleryOpen, allImages.length]);


  useEffect(() => {
    if (!canReserve) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const shouldAutoOpen =
      params.get("directReservation") === "1" ||
      params.get("fromHomeSearch") === "1" ||
      window.sessionStorage.getItem("kule:directReservation") === "1";

    if (!shouldAutoOpen) return;

    window.sessionStorage.removeItem("kule:directReservation");

    const timer = window.setTimeout(() => {
      const reservationLink = document.querySelector<HTMLAnchorElement>(
        "[data-kule-reserve-action] a[href]"
      );

      if (reservationLink?.href) {
        window.location.href = reservationLink.href;
        return;
      }

      const reservationButton = document.querySelector<HTMLButtonElement>(
        "[data-kule-reserve-action] button"
      );

      reservationButton?.click();
    }, 350);

    return () => window.clearTimeout(timer);
    // kule:auto-whatsapp-direct
  }, [canReserve, checkin, checkout, adults, children]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    let savedSearch: {
      checkin?: string;
      checkout?: string;
      adults?: string | number;
      children?: string | number;
    } = {};

    try {
      savedSearch = JSON.parse(window.sessionStorage.getItem("kule:lastSearch") || "{}");
    } catch {
      savedSearch = {};
    }

    const nextCheckin = params.get("checkin") || savedSearch.checkin || "";
    const nextCheckout = params.get("checkout") || savedSearch.checkout || "";
    const nextAdults = Number(
      params.get("adults") ||
        params.get("adult") ||
        params.get("guests") ||
        params.get("guestCount") ||
        savedSearch.adults ||
        adults ||
        2
    );
    const nextChildren = Number(
      params.get("children") ||
        params.get("child") ||
        params.get("kids") ||
        savedSearch.children ||
        children ||
        0
    );

    if (nextCheckin && nextCheckin !== checkin) {
      setCheckin(nextCheckin);
    }

    if (nextCheckout && nextCheckout !== checkout) {
      setCheckout(nextCheckout);
    }

    if (Number.isFinite(nextAdults) && nextAdults > 0 && nextAdults !== adults) {
      setAdults(nextAdults);
    }

    if (Number.isFinite(nextChildren) && nextChildren >= 0 && nextChildren !== children) {
      setChildren(nextChildren);
    }

    if (nextCheckin && nextCheckout) {
      window.sessionStorage.setItem(
        "kule:lastSearch",
        JSON.stringify({
          checkin: nextCheckin,
          checkout: nextCheckout,
          adults: String(Number.isFinite(nextAdults) && nextAdults > 0 ? nextAdults : 2),
          children: String(Number.isFinite(nextChildren) && nextChildren >= 0 ? nextChildren : 0)
        })
      );
    }
    // kule:sync-home-search-to-detail
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    let savedSearch: {
      checkin?: string;
      checkout?: string;
      adults?: string | number;
      children?: string | number;
    } = {};

    try {
      savedSearch = JSON.parse(window.sessionStorage.getItem("kule:lastSearch") || "{}");
    } catch {
      savedSearch = {};
    }

    const nextCheckin = params.get("checkin") || savedSearch.checkin || "";
    const nextCheckout = params.get("checkout") || savedSearch.checkout || "";
    const nextAdults = Number(
      params.get("adults") ||
        params.get("adult") ||
        params.get("guests") ||
        params.get("guestCount") ||
        savedSearch.adults ||
        2
    );
    const nextChildren = Number(
      params.get("children") ||
        params.get("child") ||
        params.get("kids") ||
        savedSearch.children ||
        0
    );

    if (nextCheckin && nextCheckin !== checkin) setCheckin(nextCheckin);
    if (nextCheckout && nextCheckout !== checkout) setCheckout(nextCheckout);
    if (Number.isFinite(nextAdults) && nextAdults > 0 && nextAdults !== adults) setAdults(nextAdults);
    if (Number.isFinite(nextChildren) && nextChildren >= 0 && nextChildren !== children) setChildren(nextChildren);

    if (nextCheckin && nextCheckout) {
      window.sessionStorage.setItem(
        "kule:lastSearch",
        JSON.stringify({
          checkin: nextCheckin,
          checkout: nextCheckout,
          adults: String(Number.isFinite(nextAdults) && nextAdults > 0 ? nextAdults : 2),
          children: String(Number.isFinite(nextChildren) && nextChildren >= 0 ? nextChildren : 0)
        })
      );
    }
    // kule:detail-search-sync
  }, []);
  function changeMonth(direction: number) {
    const next = new Date(calendarYear, calendarMonth + direction, 1);
    setCalendarYear(next.getFullYear());
    setCalendarMonth(next.getMonth());
  }

  function selectDate(date: string) {
    if (!date || date < todayKey) return;

    const dayData = sheetDayMap.get(date);
    const isBusy = isBusyStatus(dayData?.status);

    if (!checkin || checkout) {
      if (isBusy) return;
      setCheckin(date);
      setCheckout("");
      return;
    }

    if (checkin && !checkout) {
      if (toDate(date) <= toDate(checkin)) {
        if (isBusy) return;
        setCheckin(date);
        setCheckout("");
        return;
      }

      const hasBlockedNight = hasBusyNightBetween(checkin, date, sheetDayMap);

      if (hasBlockedNight) {
        return;
      }

      setCheckout(date);
    }
  }

  function changeChildren(nextValue: number) {
    const value = Math.max(0, nextValue);
    setChildren(value);
    setChildAges((current) => current.slice(0, value));
  }

  function setChildAge(index: number, value: string) {
    const age = Number(value);

    setChildAges((current) => {
      const next = [...current];
      next[index] = age;

      return next.filter((item) => Number.isFinite(item));
    });
  }

  function openGallery(index: number) {
    setActiveImage(index);
    setGalleryOpen(true);
  }

  function moveImage(direction: number) {
    setActiveImage((current) => (current + direction + allImages.length) % allImages.length);
  }

  function handleTouchEnd(endX: number) {
    if (touchStartX === null || allImages.length < 2) return;

    const delta = touchStartX - endX;

    if (Math.abs(delta) > 45) {
      moveImage(delta > 0 ? 1 : -1);
    }

    setTouchStartX(null);
  }

  return (
    <main className="kule-pro-page">
      <Header businessName={googleBusinessName} />

      <section
        className="kule-pro-hero"
        onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
        onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
      >
        <div className="kule-pro-hero-bg">
          <img src={activeImageSrc} alt={property.name} />
        </div>

        <div className="kule-container kule-pro-hero-grid">
          <div className="kule-pro-hero-content">
            <span className="kule-pro-badge">✦ Kule Sapanca Koleksiyonu</span>

            <h1 className="kule-pro-hero-title">{property.name}</h1>

            <p className="kule-pro-hero-summary">
              {property.summary || "Özel havuzlu, jakuzili, şömineli premium Sapanca villası."}
            </p>

            <div className="kule-pro-hero-stats">
              <HeroStat label="Google Puanı" value={googleRating.toFixed(1)} icon="⭐" />
              <HeroStat label="Google Yorumu" value={`${googleReviewCount}`} icon="💬" />
              <HeroStat label="Konum" value={property.locationLabel || "Sapanca"} icon="📍" />
              <HeroStat label="Max Kapasite" value={`${property.maxGuests} kişi`} icon="👥" />
              <HeroStat label="Plan" value={property.layout || "1+1"} icon="🛏️" />
              <HeroStat label="Keyif" value="Jakuzi" icon="🛁" />
            </div>

            <button type="button" onClick={() => openGallery(0)} className="kule-pro-gallery-open">
              ▦ Tüm fotoğrafları görüntüle
            </button>
          </div>
          <div className="kule-pro-hero-reservation-desktop">
            <ReservationPanel
          monthLabel={monthLabel}
          calendarDays={calendarDays}
          sheetDayMap={sheetDayMap}
          todayKey={todayKey}
          checkin={checkin}
          checkout={checkout}
          adults={adults}
          children={children}
          childAges={childAges}
          nights={nights}
          hasDateSelection={hasDateSelection}
          canReserve={canReserve}
          stayRuleMessage={stayRuleMessage}
          withinGuestLimit={withinGuestLimit}
          totalGuests={totalGuests}
          baseGuestLimit={baseGuestLimit}
          extraGuestCount={extraGuestCount}
          extraGuestDailyFee={extraGuestDailyFee}
          baseSubtotal={baseSubtotal}
          extraGuestTotal={extraGuestTotal}
          selectedRows={selectedRows}
          subtotal={subtotal}
          cleaningFee={cleaningFee}
          total={total}
          property={property}
          onPrevMonth={() => changeMonth(-1)}
          onNextMonth={() => changeMonth(1)}
          onSelectDate={selectDate}
          onAdultsChange={setAdults}
          onChildrenChange={changeChildren}
          onChildAgeChange={setChildAge}
        />
          </div>
        </div>
      </section>

      <section className="kule-container kule-pro-content-grid">
        <div className="kule-pro-main-stack">
          <GoogleReviewSummary
            businessName={googleBusinessName}
            rating={googleRating}
            count={googleReviewCount}
            reviews={reviewItems}
            url={property.googleReviewUrl}
          />

          <section className="kule-pro-why-photo-grid">
            <WhyChooseCard rating={googleRating} count={googleReviewCount} propertyName={property.name} />
            <PhotoMosaic images={allImages} onOpen={openGallery} />
          </section>

          <FeatureSection features={features} />
        </div>

        <ReservationPanel
          monthLabel={monthLabel}
          calendarDays={calendarDays}
          sheetDayMap={sheetDayMap}
          todayKey={todayKey}
          checkin={checkin}
          checkout={checkout}
          adults={adults}
          children={children}
          childAges={childAges}
          nights={nights}
          hasDateSelection={hasDateSelection}
          canReserve={canReserve}
          stayRuleMessage={stayRuleMessage}
          withinGuestLimit={withinGuestLimit}
          totalGuests={totalGuests}
          baseGuestLimit={baseGuestLimit}
          extraGuestCount={extraGuestCount}
          extraGuestDailyFee={extraGuestDailyFee}
          baseSubtotal={baseSubtotal}
          extraGuestTotal={extraGuestTotal}
          selectedRows={selectedRows}
          subtotal={subtotal}
          cleaningFee={cleaningFee}
          total={total}
          property={property}
          onPrevMonth={() => changeMonth(-1)}
          onNextMonth={() => changeMonth(1)}
          onSelectDate={selectDate}
          onAdultsChange={setAdults}
          onChildrenChange={changeChildren}
          onChildAgeChange={setChildAge}
        />

        <TrustBar />
      </section>

      <MobileStickyReserveBar
        property={property}
        checkin={checkin}
        checkout={checkout}
        adults={adults}
        children={children}
        childAges={childAges}
        nights={nights}
        hasDateSelection={hasDateSelection}
        canReserve={canReserve}
        total={total}
        onSelectDates={() =>
          document.getElementById("reservation")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
          })
        }
      />

      {galleryOpen ? (
        <div
          className="kule-pro-lightbox"
          role="dialog"
          aria-modal="true"
          onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
          onTouchEnd={(event) => handleTouchEnd(event.changedTouches[0]?.clientX ?? 0)}
        >
          <button
            type="button"
            className="kule-pro-lightbox-close"
            onClick={() => setGalleryOpen(false)}
            aria-label="Kapat"
          >
            ×
          </button>

          <button
            type="button"
            className="kule-pro-lightbox-arrow is-left"
            onClick={() => moveImage(-1)}
            aria-label="Önceki görsel"
          >
            ‹
          </button>

          <img src={activeImageSrc} alt={`${property.name} galeri`} />

          <button
            type="button"
            className="kule-pro-lightbox-arrow is-right"
            onClick={() => moveImage(1)}
            aria-label="Sonraki görsel"
          >
            ›
          </button>

          <span className="kule-pro-lightbox-count">
            {activeImage + 1} / {allImages.length}
          </span>
        </div>
      ) : null}
    </main>
  );
}

export function PremiumPropertyDetail(props: Props) {
  return <PremiumPropertyDetailPro {...props} />;
}

function Header({ businessName }: { businessName: string }) {
  return (
    <header className="kule-pro-header">
      <div className="kule-container kule-pro-header-inner">
        <a href="/" className="kule-pro-brand">
          <span className="kule-pro-logo"><img src="/uploads/kule-sapanca-logo.webp" alt="Kule Sapanca Logo" /></span>
          <span>
            <strong className="kule-pro-brand-title">{businessName}</strong>
            <span className="kule-pro-brand-subtitle">Premium Villa</span>
          </span>
        </a>

        <nav className="kule-pro-nav">
          <a href="/">Ana Sayfa</a>
          <a href="/#villas">Villalarımız</a>
          <a href="#experience">Deneyimler</a>
          <a href="#reviews">Yorumlar</a>
          <a href="#location">Konum</a>
          <a href="#contact">İletişim</a>
        </nav>

        <div className="kule-pro-header-actions">
          <button type="button" className="kule-pro-ghost-btn">
            ♡ Favorilerim
          </button>

          <a href="#reservation" className="kule-pro-primary-btn">
            📅 Rezervasyon Yap
          </a>
        </div>
      </div>
    </header>
  );
}

function HeroStat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="kule-pro-stat-card">
      <div className="kule-pro-stat-value">
        <span>{icon}</span>
        <strong>{value}</strong>
      </div>

      <span className="kule-pro-stat-label">{label}</span>
    </div>
  );
}

type ReservationPanelProps = {
  monthLabel: string;
  calendarDays: CalendarDay[];
  sheetDayMap: Map<string, SheetDay>;
  todayKey: string;
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
  childAges: number[];
  nights: number;
  hasDateSelection: boolean;
  canReserve: boolean;
  stayRuleMessage: string;
  withinGuestLimit: boolean;
  totalGuests: number;
  baseGuestLimit: number;
  extraGuestCount: number;
  extraGuestDailyFee: number;
  baseSubtotal: number;
  extraGuestTotal: number;
  selectedRows: SelectedPriceRow[];
  subtotal: number;
  cleaningFee: number;
  total: number;
  property: PropertyWithSheetRows;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: string) => void;
  onAdultsChange: (value: number) => void;
  onChildrenChange: (value: number) => void;
  onChildAgeChange: (index: number, value: string) => void;
};

function ReservationPanel(props: ReservationPanelProps) {
  const {
    monthLabel,
    calendarDays,
    sheetDayMap,
    todayKey,
    checkin,
    checkout,
    adults,
    children,
    childAges,
    nights,
    hasDateSelection,
    canReserve,
    stayRuleMessage,
    withinGuestLimit,
    totalGuests,
    baseGuestLimit,
    extraGuestCount,
    extraGuestDailyFee,
    baseSubtotal,
    extraGuestTotal,
    selectedRows,
    subtotal,
    cleaningFee,
    total,
    property,
    onPrevMonth,
    onNextMonth,
    onSelectDate,
    onAdultsChange,
    onChildrenChange,
    onChildAgeChange
  } = props;

  void childAges;
  void onChildAgeChange;

  return (
    <aside id="reservation" className="kule-pro-reservation-card">
      <div className="kule-pro-reservation-head">
        <span className="kule-pro-reservation-icon">📅</span>
        <strong>Rezervasyon Bilgileri</strong>
      </div>

      <div className="kule-pro-calendar">
        <div className="kule-pro-calendar-top">
          <strong>{monthLabel}</strong>

          <div className="kule-pro-calendar-arrows">
            <button type="button" onClick={onPrevMonth} aria-label="Önceki ay">
              ‹
            </button>
            <button type="button" onClick={onNextMonth} aria-label="Sonraki ay">
              ›
            </button>
          </div>
        </div>

        <div className="kule-pro-weekdays">
          {weekdays.map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="kule-pro-calendar-days">
          {calendarDays.map((item, index) => {
            const dayData = item.date ? sheetDayMap.get(item.date) : undefined;
            const status = normalizeStatus(dayData?.status);
            const isBusy = isBusyStatus(status);
            const isPast = Boolean(item.date) && item.date < todayKey;
            const isSelected = item.date === checkin || item.date === checkout;

            const isCheckoutCandidate =
              Boolean(checkin) &&
              !checkout &&
              Boolean(item.date) &&
              toDate(item.date) > toDate(checkin) &&
              !hasBusyNightBetween(checkin, item.date, sheetDayMap);

            const blocksSelection = isBusy && !isCheckoutCandidate && !isSelected;

            const inRange =
              Boolean(checkin) &&
              Boolean(checkout) &&
              Boolean(item.date) &&
              toDate(item.date) > toDate(checkin) &&
              toDate(item.date) < toDate(checkout);

            const className = [
              "kule-pro-calendar-day",
              !item.day ? "is-empty" : "",
              isSelected ? "is-selected" : "",
              inRange ? "is-range" : "",
              blocksSelection ? "is-busy" : "",
              isBusy && isCheckoutCandidate ? "is-checkout-candidate" : "",
              isPast ? "is-past" : ""
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                type="button"
                key={`${item.date || "empty"}-${index}`}
                disabled={!item.day || isPast || blocksSelection}
                onClick={() => onSelectDate(item.date)}
                className={className}
                aria-label={item.date || `empty-${index}`}
              >
                {item.day ? (
                  <>
                    <strong>{item.day}</strong>
                    {isBusy && isCheckoutCandidate ? (
                      <small>Çıkış</small>
                    ) : isBusy ? (
                      <small>Dolu</small>
                    ) : dayData?.price ? (
                      <small>{formatPrice(dayData.price)}</small>
                    ) : (
                      <small>Sor</small>
                    )}
                  </>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {hasDateSelection ? (
        <div className="kule-pro-selected-card">
          <div className="kule-pro-selected-main">
            <div>
              <strong>
                {formatDate(checkin, { day: "numeric", month: "long" })} –{" "}
                {formatDate(checkout, { day: "numeric", month: "long" })}
              </strong>
              <span>
                {nights} gece · {adults} yetişkin
                {children > 0 ? ` · ${children} çocuk` : ""}
              </span>
            </div>

            {total ? <div className="kule-pro-selected-total">₺{formatPrice(total)}</div> : null}
          </div>

          <p>
            Baz fiyat {baseGuestLimit} yetişkin içindir.
            {extraGuestCount > 0
              ? ` +${extraGuestCount} ek kişi için günlük ₺${formatPrice(extraGuestDailyFee)} eklenmiştir.`
              : " Ek yetişkin ücreti oluşmadı."}
          </p>
        </div>
      ) : null}

      {hasDateSelection && selectedRows.length ? (
        <div className="kule-pro-price-card">
          <strong>Fiyat Detayı</strong>

          {selectedRows.map((row) => (
            <div key={row.date} className="kule-pro-price-row kule-pro-price-row-stacked">
              <span>
                {formatDate(row.date, { day: "numeric", month: "long", year: "numeric" })}
                {row.extraGuestFee > 0 ? (
                  <small>
                    Baz ₺{formatPrice(row.basePrice)} + ek kişi ₺{formatPrice(row.extraGuestFee)}
                  </small>
                ) : null}
              </span>
              <strong>{row.totalPrice ? `₺${formatPrice(row.totalPrice)}` : "Sor"}</strong>
            </div>
          ))}

          <div className="kule-pro-price-divider">
            <div className="kule-pro-price-row">
              <span>Konaklama Toplamı</span>
              <strong>₺{formatPrice(baseSubtotal)}</strong>
            </div>

            {extraGuestTotal > 0 ? (
              <div className="kule-pro-price-row">
                <span>
                  Ek yetişkin ücreti
                  <small>
                    {extraGuestCount} kişi × {nights} gece × ₺{formatPrice(EXTRA_GUEST_DAILY_FEE)}
                  </small>
                </span>
                <strong>₺{formatPrice(extraGuestTotal)}</strong>
              </div>
            ) : null}

            {cleaningFee > 0 ? (
              <div className="kule-pro-price-row">
                <span>Temizlik Ücreti</span>
                <strong>₺{formatPrice(cleaningFee)}</strong>
              </div>
            ) : null}

            <div className="kule-pro-price-row">
              <span>Ara Toplam</span>
              <strong>₺{formatPrice(subtotal)}</strong>
            </div>

            <div className="kule-pro-price-total">
              <span>Toplam</span>
              <strong>₺{formatPrice(total)}</strong>
            </div>

            <p className="kule-pro-payment-note">
              Baz fiyat {baseGuestLimit} yetişkin içindir. Bu rezervasyonda toplam {totalGuests} kişi seçildi. 0-12 yaş çocuklar ücretsizdir.
            </p>
          </div>
        </div>
      ) : null}

      <GuestCounter label="Yetişkin" value={adults} min={1} onChange={onAdultsChange} />
      <GuestCounter label="Çocuk" value={children} min={0} onChange={onChildrenChange} />

      {children > 0 ? (
        <div className="kule-pro-child-note">
          0-12 yaş çocuklar ücretsizdir. Çocuklar kapasiteye dahil edilir, ek kişi ücreti oluşturmaz.
        </div>
      ) : null}

      {!withinGuestLimit ? (
        <div className="kule-pro-warning">
          Bu ev için maksimum kişi sayısı {property.maxGuests} kişidir. Lütfen kişi sayısını azaltınız.
        </div>
      ) : !canReserve ? (
        <div className="kule-pro-warning">
          Rezervasyon için tarih, kişi sayısı ve varsa çocuk yaşlarını seçiniz.
        </div>
      ) : null}

      <div className="kule-pro-reserve-action" data-kule-reserve-action>
        <ReserveButton
          disabled={!canReserve}
          payload={{
            propertySlug: property.slug,
            propertyName: property.name,
            mode: "exact",
            checkin,
            checkout,
            adults,
            children,
            childAges
          }}
        />
      </div>

      <small className="kule-pro-secure-note">🔒 Bilgileriniz güvenle iletilir.</small>
    </aside>
  );
}


function MobileStickyReserveBar({
  property,
  checkin,
  checkout,
  adults,
  children,
  childAges,
  nights,
  hasDateSelection,
  canReserve,
  total,
  onSelectDates
}: {
  property: PropertyWithSheetRows;
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
  childAges: number[];
  nights: number;
  hasDateSelection: boolean;
  canReserve: boolean;
  total: number;
  onSelectDates: () => void;
}) {
  const dateSummary = hasDateSelection
    ? `${formatDate(checkin, { day: "numeric", month: "short" })} – ${formatDate(checkout, {
        day: "numeric",
        month: "short"
      })} · ${nights} gece`
    : "Tarih seç, canlı fiyatı gör";

  const guestSummary = `${adults} yetişkin${children > 0 ? ` · ${children} çocuk` : ""}`;

  return (
    <div className="kule-pro-mobile-sticky" role="region" aria-label="Mobil rezervasyon kısayolu">
      <div className="kule-pro-mobile-sticky-inner">
        <div className="kule-pro-mobile-sticky-info">
          <strong>{hasDateSelection && total ? `₺${formatPrice(total)}` : "Canlı fiyat"}</strong>
          <span>{dateSummary}</span>
          <small>{guestSummary}</small>
        </div>

        <div className="kule-pro-mobile-action">
          {canReserve ? (
            <ReserveButton
              disabled={false}
              payload={{
                propertySlug: property.slug,
                propertyName: property.name,
                mode: "exact",
                checkin,
                checkout,
                adults,
                children,
                childAges
              }}
            />
          ) : (
            <button type="button" className="kule-pro-mobile-scroll-btn" onClick={onSelectDates}>
              {hasDateSelection ? "Bilgileri Tamamla" : "Tarih Seç"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
function GuestCounter({
  label,
  value,
  min,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="kule-pro-guest-row">
      <span>{label}</span>

      <div className="kule-pro-counter">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))}>
          −
        </button>
        <strong>{value}</strong>
        <button type="button" onClick={() => onChange(value + 1)}>
          +
        </button>
      </div>
    </div>
  );
}

function GoogleReviewSummary({
  businessName,
  rating,
  count,
  reviews,
  url
}: {
  businessName: string;
  rating: number;
  count: number;
  reviews: DisplayReview[];
  url?: string;
}) {
  return (
    <section className="kule-pro-card kule-pro-google-summary">
      <div className="kule-pro-google-grid">
        <div className="kule-pro-google-left">
          <div className="kule-pro-google-logo">
            <GoogleIcon />
          </div>

          <h2 className="kule-pro-section-title">Google’da {rating.toFixed(1)} / 5</h2>
          <div className="kule-pro-stars">★★★★★</div>

          <strong className="kule-pro-review-count">
            {businessName} işletme profiline ait {count} yorum
          </strong>

          <p className="kule-pro-muted-text">
            Bu yorumlar villa bazlı değil, KULE SAPANCA Google İşletme Profili üzerinden alınır.
          </p>
        </div>

        <div className="kule-pro-review-mini-grid">
          {reviews.slice(0, 3).map((review) => (
            <article key={review.id} className="kule-pro-review-card">
              <div className="kule-pro-review-user">
                {review.profilePhotoUrl ? (
                  <img className="kule-pro-avatar-img" src={review.profilePhotoUrl} alt={review.authorName} />
                ) : (
                  <span className="kule-pro-avatar">{getInitials(review.authorName)}</span>
                )}

                <div>
                  <strong>{review.authorName}</strong>
                  <span>{review.relativeTime || "Google Yorumu"}</span>
                </div>
              </div>

              <div className="kule-pro-stars">{"★".repeat(review.rating)}</div>
              <p className="kule-pro-review-text-full">{review.text}</p>

              <div className="kule-pro-google-tag">
                <GoogleIcon /> Google Yorumu
              </div>
            </article>
          ))}
        </div>
      </div>

      {url ? (
        <a href={url} target="_blank" rel="noreferrer" className="kule-pro-google-link">
          Tüm Google yorumlarını gör →
        </a>
      ) : (
        <div className="kule-pro-google-link">Tüm Google yorumlarını gör →</div>
      )}
    </section>
  );
}

function WhyChooseCard({
  rating,
  count,
  propertyName
}: {
  rating: number;
  count: number;
  propertyName: string;
}) {
  const items = [
    "Özel kullanım alanı ile tamamen size ait bir tatil",
    "Havuz, jakuzi ve şömine ile dört mevsim konfor",
    "Aile ve arkadaş grupları için ideal alan",
    "Sapanca merkeze yakın, doğa ile iç içe konum",
    "Google yorumlarıyla doğrulanmış misafir memnuniyeti"
  ];

  return (
    <section className="kule-pro-card kule-pro-why-card">
      <span className="kule-pro-badge-soft">Premium deneyim</span>
      <h2 className="kule-pro-section-title">Neden {propertyName}?</h2>

      <ul className="kule-pro-check-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      <div className="kule-pro-rating-box">
        <strong>{rating.toFixed(1)} Google Puanı</strong>
        <span>{count} doğrulanmış işletme yorumu</span>
      </div>
    </section>
  );
}

function PhotoMosaic({ images, onOpen }: { images: string[]; onOpen: (index: number) => void }) {
  return (
    <section className="kule-pro-photo-mosaic">
      <button type="button" onClick={() => onOpen(0)}>
        <img src={images[0] ?? fallbackHeroImage} alt="Villa ana görsel" />
      </button>

      {images.slice(1, 5).map((image, index) => (
        <button key={image} type="button" onClick={() => onOpen(index + 1)}>
          <img src={image} alt={`Villa görsel ${index + 2}`} />
          {index === 3 ? (
            <span className="kule-pro-photo-more">+{Math.max(0, images.length - 5)} Fotoğraf</span>
          ) : null}
        </button>
      ))}
    </section>
  );
}

function FeatureSection({ features }: { features: FeatureItem[] }) {
  return (
    <section id="features" className="kule-pro-card kule-pro-features">
      <h2 className="kule-pro-section-title">Özellikler</h2>

      <div className="kule-pro-feature-groups">
        {featureGroups.map((group) => {
          const items = features.filter((feature) => feature.group === group);

          return (
            <div key={group} className="kule-pro-feature-group">
              <h3>{group}</h3>

              <ul>
                {items.map((feature) => (
                  <li key={`${feature.icon}-${feature.text}`}>
                    <span>{feature.icon}</span>
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TrustBar() {
  const items = [
    {
      icon: "🏅",
      title: "Savibu Üyesi",
      text: "İşletme bilgileri ve rezervasyon süreci güvenle yönetilir."
    },
    {
      icon: "💬",
      title: "Hızlı İletişim",
      text: "Rezervasyon ekibi kısa sürede ulaşır."
    },
    {
      icon: "🔁",
      title: "Esnek Değişiklik",
      text: "Tarih değişikliklerinde destek sağlanır."
    },
    {
      icon: "✨",
      title: "Hijyen & Temizlik",
      text: "Profesyonel temizlik standartları uygulanır."
    },
    {
      icon: "👍",
      title: "Misafir Memnuniyeti",
      text: "Google yorumlarıyla güvenilir hizmet."
    }
  ];

  return (
    <section className="kule-pro-card kule-pro-trust-bar">
      {items.map((item) => (
        <div key={item.title} className="kule-pro-trust-item">
          <div className="kule-pro-trust-icon">{item.icon}</div>
          <strong>{item.title}</strong>
          <p>{item.text}</p>
        </div>
      ))}
    </section>
  );
}



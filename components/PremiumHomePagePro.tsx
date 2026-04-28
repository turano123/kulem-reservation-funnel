"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  differenceInCalendarDays,
  format,
  isBefore,
  isSameDay,
  startOfDay,
  startOfMonth,
} from "date-fns";
import type { Property, PropertyLiveCardMeta } from "../lib/types";
import { formatCurrency, formatDate as formatDisplayDate } from "../lib/format";
import styles from "./PremiumHomePagePro.module.css";

type Props = {
  properties: Property[];
  liveMetaMap: Record<string, PropertyLiveCardMeta | undefined>;
  defaultQuery: string;
};

type IconName =
  | "heart"
  | "calendar"
  | "calendarCheck"
  | "google"
  | "users"
  | "child"
  | "shield"
  | "whatsapp"
  | "sparkles"
  | "leaf"
  | "lock"
  | "headset"
  | "mapPin"
  | "pool"
  | "bath"
  | "fire"
  | "star"
  | "search"
  | "camera"
  | "wallet"
  | "clock"
  | "arrow"
  | "minus"
  | "plus"
  | "bed"
  | "coffee";

type MonthPreviewResponse = {
  ok: boolean;
  mode?: "month";
  month?: string;
  currency?: string;
  days?: Array<{
    date: string;
    lowestPrice: number | null;
    availableCount: number;
    availableProperties?: Array<{
      slug: string;
      name: string;
      price: number;
      sheetTitle?: string;
    }>;
  }>;
  message?: string;
};

type DayPriceMap = Record<
  string,
  {
    date: string;
    lowestPrice: number | null;
    availableCount: number;
    availableProperties?: Array<{
      slug: string;
      name: string;
      price: number;
      sheetTitle?: string;
    }>;
  }
>;

type CalendarRange = {
  from?: Date;
  to?: Date;
};

type CalendarCell = {
  key: string;
  date: Date | null;
  dateKey: string;
  day: number | null;
};

const PREFETCH_MONTH_COUNT = 1;
const EXTRA_GUEST_DAILY_FEE = 500;
const fallbackHeroImage = "/uploads/kule-suit-dron.jpg";

const trustItems: Array<{
  icon: IconName;
  title: string;
  text: string;
}> = [
  {
    icon: "google",
    title: "4.9 Google Puanı",
    text: "250+ doğrulanmış yorum",
  },
  {
    icon: "users",
    title: "Sahibinden",
    text: "Doğrudan işletme",
  },
  {
    icon: "shield",
    title: "Güvenli Ödeme",
    text: "256 bit SSL koruma",
  },
  {
    icon: "whatsapp",
    title: "WhatsApp Destek",
    text: "7/24 hızlı iletişim",
  },
  {
    icon: "sparkles",
    title: "10.000+ Mutlu Misafir",
    text: "Kaliteden ödün vermiyoruz",
  },
];

const featureItems: Array<{
  icon: IconName;
  title: string;
  text: string;
}> = [
  {
    icon: "leaf",
    title: "Premium Konfor",
    text: "En kaliteli ekipmanlar ve özenle tasarlanmış yaşam alanları",
  },
  {
    icon: "lock",
    title: "Tam Mahremiyet",
    text: "Sadece size özel havuzlar ve korunaklı alanlar",
  },
  {
    icon: "calendarCheck",
    title: "Canlı Müsaitlik",
    text: "Güncel takvim ve fiyatlarla anında rezervasyon talebi",
  },
  {
    icon: "headset",
    title: "7/24 Destek",
    text: "WhatsApp üzerinden hızlı ve kesintisiz iletişim",
  },
  {
    icon: "mapPin",
    title: "Eşsiz Konum",
    text: "Sapanca’nın en güzel noktalarında, doğa ile iç içe",
  },
];

function PremiumIcon({ name }: { name: IconName }) {
  if (name === "google") {
    return (
      <span className="kp-google-icon" aria-hidden="true">
        G
      </span>
    );
  }

  const commonProps = {
    className: "kp-svg-icon",
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    fill: "none",
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

  if (name === "calendar" || name === "calendarCheck") {
    return (
      <svg {...commonProps}>
        <path
          d="M7 3.8v3M17 3.8v3M4.8 9.2h14.4M6.5 5.5h11c1.4 0 2.5 1.1 2.5 2.5v10.2c0 1.4-1.1 2.5-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.2V8c0-1.4 1.1-2.5 2.5-2.5Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {name === "calendarCheck" ? (
          <path
            d="m8.3 14.8 2.1 2 4.8-5"
            stroke="currentColor"
            strokeWidth="1.85"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </svg>
    );
  }

  if (name === "users" || name === "child") {
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

  if (name === "whatsapp") {
    return (
      <svg {...commonProps}>
        <path
          d="M12 3.2a8.8 8.8 0 0 1 7.5 13.4l.8 3.1-3.2-.8A8.8 8.8 0 1 1 12 3.2Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M8.8 8.8c.2-.4.4-.5.8-.5h.6c.3 0 .5.1.6.5l.8 1.9c.1.2.1.4 0 .6l-.7.8c-.2.2-.2.4 0 .7.4.7 1 1.4 1.7 2 .8.7 1.6 1.1 2.2 1.3.3.1.5.1.7-.1l.9-1.1c.2-.3.5-.3.8-.2l2 1c.3.1.5.3.5.5.1.5-.2 1.5-.8 2.1-.7.7-1.8 1.1-2.9 1-1.2-.1-2.6-.5-4.1-1.4-2.4-1.4-4.4-3.4-5.8-5.8-.9-1.5-1.4-2.9-1.4-4.1 0-1.1.4-2.2 1.1-2.9.4-.4.9-.6 1.5-.6Z"
          stroke="currentColor"
          strokeWidth="1.45"
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

  if (name === "lock") {
    return (
      <svg {...commonProps}>
        <path
          d="M7.2 10V8.1a4.8 4.8 0 0 1 9.6 0V10M6.5 10h11c1.2 0 2.2 1 2.2 2.2v6.3c0 1.2-1 2.2-2.2 2.2h-11c-1.2 0-2.2-1-2.2-2.2v-6.3c0-1.2 1-2.2 2.2-2.2Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 14.1v2.5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "headset") {
    return (
      <svg {...commonProps}>
        <path
          d="M4.2 13.2v-1.1a7.8 7.8 0 0 1 15.6 0v1.1M7.6 18.2H6.8a2.6 2.6 0 0 1-2.6-2.6v-1.1a2.6 2.6 0 0 1 2.6-2.6h.8v6.3ZM16.4 18.2h.8a2.6 2.6 0 0 0 2.6-2.6v-1.1a2.6 2.6 0 0 0-2.6-2.6h-.8v6.3ZM14.3 20.5h1.1c2.2 0 3.7-1.1 4.1-3"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "mapPin") {
    return (
      <svg {...commonProps}>
        <path
          d="M12 21s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 11.8a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z"
          stroke="currentColor"
          strokeWidth="1.8"
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

  if (name === "search") {
    return (
      <svg {...commonProps}>
        <path
          d="M10.8 18.1a7.3 7.3 0 1 0 0-14.6 7.3 7.3 0 0 0 0 14.6ZM16.2 16.2 21 21"
          stroke="currentColor"
          strokeWidth="1.9"
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

  if (name === "wallet") {
    return (
      <svg {...commonProps}>
        <path
          d="M4.5 7.5h14.2c1.2 0 2.3 1 2.3 2.3v7.4c0 1.2-1 2.3-2.3 2.3H5.3C4 19.5 3 18.5 3 17.2V6.8c0-1.2 1-2.3 2.3-2.3h11.4"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16.5 13.5H21v-3h-4.5a1.5 1.5 0 0 0 0 3Z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "clock") {
    return (
      <svg {...commonProps}>
        <path
          d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M12 7.2V12l3.2 2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
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

  if (name === "minus") {
    return (
      <svg {...commonProps}>
        <path
          d="M5.5 12h13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "plus") {
    return (
      <svg {...commonProps}>
        <path
          d="M12 5.5v13M5.5 12h13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
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

function formatPrice(price?: number | null) {
  if (!price || price <= 0) return "";
  return new Intl.NumberFormat("tr-TR").format(price);
}

function formatDateForLabel(date?: Date) {
  if (!date) return "";
  return format(date, "dd.MM.yyyy");
}

function onlyDigits(value: string) {
  return value.replace(/[^\d]/g, "");
}

function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function toMonthKey(date: Date) {
  return format(date, "yyyy-MM");
}

function monthKeyToDate(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

function addMonthsTo(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function buildMonthMap(data: MonthPreviewResponse): DayPriceMap {
  const mapped: DayPriceMap = {};

  for (const item of data.days ?? []) {
    mapped[item.date] = {
      date: item.date,
      lowestPrice: item.lowestPrice,
      availableCount: item.availableCount,
      availableProperties: item.availableProperties ?? [],
    };
  }

  return mapped;
}

function getCalendarCells(monthDate: Date): CalendarCell[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const cells: CalendarCell[] = [];

  for (let index = 0; index < startOffset; index += 1) {
    cells.push({
      key: `empty-start-${index}`,
      date: null,
      dateKey: "",
      day: null,
    });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const date = new Date(year, month, day);

    cells.push({
      key: toDateKey(date),
      date,
      dateKey: toDateKey(date),
      day,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      key: `empty-end-${cells.length}`,
      date: null,
      dateKey: "",
      day: null,
    });
  }

  return cells;
}

function getMonthLabel(date: Date) {
  const label = new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  }).format(date);

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getBaseGuestCount(slug: string) {
  return slug === "kule-deluxe" ? 4 : 2;
}

function getBaseGuestLabel(slug: string) {
  return `${getBaseGuestCount(slug)} kişi baz fiyat`;
}

function getBreakfastLabel(property: Property) {
  if (property.breakfastMode === "dahil") return "Kahvaltı Dahil";
  if (property.breakfastMode === "hariç") return "Kahvaltı Hariç";
  return "Kahvaltı Opsiyonel";
}

function getExperienceChips(
  property: Property,
): Array<{ icon: IconName; text: string }> {
  const chips: Array<{ icon: IconName; text: string }> = [
    { icon: "pool", text: "Özel Havuz" },
  ];

  if (property.slug === "kule-deluxe") {
    chips.push(
      { icon: "bath", text: "2 Jakuzi" },
      { icon: "fire", text: "Şömine" },
    );
  } else if (property.slug === "kule-suit") {
    chips.push(
      { icon: "bath", text: "Jakuzi" },
      { icon: "fire", text: "Şömine" },
    );
  } else {
    chips.push(
      { icon: "bath", text: "Jakuzi" },
      { icon: "leaf", text: "Doğa Manzarası" },
    );
  }

  return chips;
}

function getPriorityLabel(slug: string) {
  if (slug === "kule-deluxe") return "En Çok Tercih Edilen";
  if (slug === "kule-suit") return "Popüler";
  return "Yeni";
}

function getImageCount(property: Property) {
  const galleryCount = property.gallery?.length ?? 0;
  return Math.max(1, galleryCount + (property.heroImage ? 1 : 0));
}

export function PremiumHomePagePro({
  properties,
  liveMetaMap,
  defaultQuery,
}: Props) {
  const heroProperty =
    properties.find((property) => property.slug === "kule-suit") ??
    properties.find((property) => property.slug === "kule-yesil-ev") ??
    properties[0];

  const heroImage = heroProperty?.heroImage || fallbackHeroImage;

  return (
    <main className={`kp-page ${styles.premiumHome}`}>
      <Header />

      <section className="kp-hero">
        <div
          className="kp-hero-media"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="kp-hero-overlay" />
        <div className="kp-hero-glow kp-hero-glow-left" />
        <div className="kp-hero-glow kp-hero-glow-right" />

        <div className="kp-container kp-hero-inner">
          <div className="kp-hero-copy">
            <span className="kp-eyebrow">
              Your Secret Garden
            </span>

            <h1>
              Sapanca’da <span>Doğa ve konfor bir arada.</span>
            </h1>

            <p>
              Özel havuzlu, sakin ve güvenli bir kaçış. Tarihini seç,
              ai destekli asistanımız sana en uygun evimizi bulsun.
            </p>

            <div
              className="kp-hero-proof-row"
              aria-label="Kule Sapanca güven unsurları"
            >
              <span>
                <PremiumIcon name="lock" />
                Korunaklı Tesis
              </span>
              <span>
                <PremiumIcon name="headset" />
                7/24 Destek AI desteği 
              </span>
              <span>
                <PremiumIcon name="shield" />
                Güvenli Rezervasyon
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="rezervasyon" className="kp-container kp-search-float">
        <PremiumSearchPanel />
      </section>

      <TrustStrip />

      <section id="villas" className="kp-container kp-villas-section">
        <div className="kp-section-head">
          <span>Kule Sapanca Koleksiyonu</span>

          <div className="kp-title-row">
            <i aria-hidden="true" />
            <h2>Size en uygun evi seçin</h2>
            <Link href={`/results?${defaultQuery}`}>Tüm Villaları Gör →</Link>
          </div>

          <p>
            Müsaitlik ve fiyatlar canlı verilerle kontrol edilir. Seçtiğiniz
            tarih ve kişi sayısına göre rezervasyon talebi oluşturabilirsiniz.
          </p>
        </div>

        <div className="kp-property-grid">
          {properties.map((property) => (
            <PremiumPropertyCard
              key={property.slug}
              property={property}
              queryString={defaultQuery}
              liveCardMeta={liveMetaMap[property.slug]}
              priorityLabel={getPriorityLabel(property.slug)}
            />
          ))}
        </div>
      </section>

      <FeatureStrip />
    </main>
  );
}

function Header() {
  return (
    <header className="kp-header">
      <div className="kp-container kp-header-inner">
        <Link href="/" className="kp-brand" aria-label="Kule Sapanca ana sayfa">
          <span className="kp-brand-mark"><img src="/uploads/kule-sapanca-logo.webp" alt="Kule Sapanca Logo" /></span>
          <span>
            <strong>KULE SAPANCA</strong>
            <small>PREMIUM VILLA</small>
          </span>
        </Link>

        <nav className="kp-nav" aria-label="Ana menü">
          <a href="/">Ana Sayfa</a>
          <a href="#villas">Villalarımız</a>
          <a href="#deneyimler">Deneyimler</a>
          <a href="#yorumlar">Yorumlar</a>
          <a href="#konum">Konum</a>
          <a href="#iletisim">İletişim</a>
        </nav>

        <div className="kp-header-actions">
          <a href="#favoriler" className="kp-ghost-btn">
            <PremiumIcon name="heart" />
            Favorilerim
          </a>

          <a href="#rezervasyon" className="kp-main-btn">
            <PremiumIcon name="calendar" />
            Rezervasyon Yap
          </a>
        </div>
      </div>
    </header>
  );
}

function PremiumSearchPanel() {
  const router = useRouter();
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const today = useMemo(() => startOfDay(new Date()), []);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [month, setMonth] = useState<Date>(today);
  const [range, setRange] = useState<CalendarRange | undefined>(undefined);

  const [monthLoading, setMonthLoading] = useState(false);
  const [monthData, setMonthData] = useState<DayPriceMap>({});
  const [monthCache, setMonthCache] = useState<
    Partial<Record<string, DayPriceMap>>
  >({});

  const cacheRef = useRef<Partial<Record<string, DayPriceMap>>>({});
  const inFlightRef = useRef<Partial<Record<string, Promise<DayPriceMap>>>>({});

  const [adultsInput, setAdultsInput] = useState<string>("2");
  const [childrenInput, setChildrenInput] = useState<string>("0");
  const [childAges, setChildAges] = useState<number[]>([]);
  const [calendarNotice, setCalendarNotice] = useState<string>("");

  const adults = adultsInput === "" ? 0 : Math.max(0, Number(adultsInput));
  const children =
    childrenInput === "" ? 0 : Math.max(0, Number(childrenInput));
  const totalGuests = adults + children;
  const monthKey = useMemo(() => toMonthKey(month), [month]);
  const calendarCells = useMemo(() => getCalendarCells(month), [month]);
  const monthLabel = useMemo(() => getMonthLabel(month), [month]);

  const nights =
    range?.from && range?.to
      ? Math.max(0, differenceInCalendarDays(range.to, range.from))
      : 0;

  useEffect(() => {
    if (!calendarOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [calendarOpen]);

  useEffect(() => {
    cacheRef.current = monthCache;
  }, [monthCache]);

  useEffect(() => {
    const safeChildren = Number.isFinite(children) ? Math.max(0, children) : 0;

    setChildAges((current) => {
      if (safeChildren === current.length) return current;
      if (safeChildren < current.length) return current.slice(0, safeChildren);

      return [
        ...current,
        ...Array.from({ length: safeChildren - current.length }, () => 0),
      ];
    });
  }, [children]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!popoverRef.current) return;
      if (popoverRef.current.contains(event.target as Node)) return;
      setCalendarOpen(false);
    }

    if (calendarOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [calendarOpen]);

  async function fetchMonthMap(targetMonthKey: string): Promise<DayPriceMap> {
    const cachedMonth = cacheRef.current[targetMonthKey];

    if (cachedMonth) return cachedMonth;

    const existingRequest = inFlightRef.current[targetMonthKey];

    if (existingRequest) return existingRequest;

    const request = (async () => {
      try {
        const res = await fetch(
          `/api/calendar-preview?month=${targetMonthKey}`,
          {
            cache: "no-store",
          },
        );

        const data = (await res.json()) as MonthPreviewResponse;

        if (!data?.ok || !data.days) return {};

        const mapped = buildMonthMap(data);

        cacheRef.current = {
          ...cacheRef.current,
          [targetMonthKey]: mapped,
        };

        setMonthCache((current) =>
          current[targetMonthKey]
            ? current
            : {
                ...current,
                [targetMonthKey]: mapped,
              },
        );

        return mapped;
      } catch {
        return {};
      } finally {
        delete inFlightRef.current[targetMonthKey];
      }
    })();

    inFlightRef.current[targetMonthKey] = request;
    return request;
  }

  useEffect(() => {
    let cancelled = false;

    async function loadVisibleMonth() {
      if (cacheRef.current[monthKey]) {
        setMonthData(cacheRef.current[monthKey] ?? {});
        setMonthLoading(false);
        return;
      }

      setMonthLoading(true);
      const mapped = await fetchMonthMap(monthKey);

      if (!cancelled) {
        setMonthData(mapped);
        setMonthLoading(false);
      }
    }

    loadVisibleMonth();

    return () => {
      cancelled = true;
    };
  }, [monthKey]);

  useEffect(() => {
    let cancelled = false;

    async function prefetchMonths() {
      const baseMonth = monthKeyToDate(monthKey);
      const targetKeys = Array.from(
        { length: PREFETCH_MONTH_COUNT },
        (_, index) => toMonthKey(addMonthsTo(baseMonth, index)),
      );

      await Promise.allSettled(
        targetKeys.map(async (key) => {
          if (cacheRef.current[key]) return;
          await fetchMonthMap(key);
        }),
      );

      if (!cancelled && cacheRef.current[monthKey]) {
        setMonthData(cacheRef.current[monthKey] ?? {});
      }
    }

    prefetchMonths();

    return () => {
      cancelled = true;
    };
  }, [monthKey]);

  function getDayInfo(date: Date) {
    const day = startOfDay(date);
    const currentMonthMap = cacheRef.current[toMonthKey(day)];
    return currentMonthMap?.[toDateKey(day)];
  }

  function isPastDay(date: Date) {
    return isBefore(startOfDay(date), today);
  }

  function canStartOn(date: Date) {
    const day = startOfDay(date);

    if (isPastDay(day)) return false;

    const info = getDayInfo(day);
    if (!info) return false;

    return info.availableCount > 0 && info.lowestPrice !== null;
  }

  function isAfterDay(date: Date, compareDate: Date) {
    return startOfDay(date).getTime() > startOfDay(compareDate).getTime();
  }

  function isSameOrBeforeDay(date: Date, compareDate: Date) {
    return startOfDay(date).getTime() <= startOfDay(compareDate).getTime();
  }

  function canStayNight(date: Date) {
    return canStartOn(date);
  }

  function hasBlockedNightBetween(from: Date, checkoutDay: Date) {
    const cursor = new Date(
      from.getFullYear(),
      from.getMonth(),
      from.getDate(),
    );
    const end = startOfDay(checkoutDay);

    while (cursor < end) {
      if (!canStayNight(cursor)) return true;
      cursor.setDate(cursor.getDate() + 1);
    }

    return false;
  }

  function canUseAsCheckout(date: Date) {
    const day = startOfDay(date);

    if (!range?.from || range.to) return false;
    if (!isAfterDay(day, range.from)) return false;

    return !hasBlockedNightBetween(range.from, day);
  }

  function isCheckoutOnlyDay(date: Date) {
    const day = startOfDay(date);

    if (!range?.from || range.to) return false;
    if (!isAfterDay(day, range.from)) return false;

    return canUseAsCheckout(day) && !canStartOn(day);
  }

  function isRangeSelectable(from: Date, to: Date) {
    const start = startOfDay(from);
    const end = startOfDay(to);

    if (!isAfterDay(end, start)) return false;
    if (!canStartOn(start)) return false;

    return !hasBlockedNightBetween(start, end);
  }

  function isDateInSelectedRange(date: Date) {
    if (!range?.from || !range?.to) return false;

    const day = startOfDay(date);
    return isAfterDay(day, range.from) && isBefore(day, range.to);
  }

  function isDayDisabled(date: Date) {
    const day = startOfDay(date);

    if (isPastDay(day)) return true;

    if (!range?.from || range.to) {
      return !canStartOn(day);
    }

    if (isSameDay(day, range.from)) return false;

    if (isBefore(day, range.from)) {
      return !canStartOn(day);
    }

    return !canUseAsCheckout(day);
  }

  function startNewRange(day: Date, notice = "") {
    setCalendarNotice(notice);
    setRange({ from: startOfDay(day), to: undefined });
  }

  function handleDayClick(day: Date) {
    const clickedDay = startOfDay(day);

    if (!range?.from || (range.from && range.to)) {
      if (!canStartOn(clickedDay)) {
        setCalendarNotice("Bu tarih giriş için müsait değil.");
        return;
      }

      startNewRange(clickedDay);
      return;
    }

    if (isSameDay(clickedDay, range.from)) {
      startNewRange(clickedDay);
      return;
    }

    if (isSameOrBeforeDay(clickedDay, range.from)) {
      if (!canStartOn(clickedDay)) {
        setCalendarNotice("Bu tarih giriş için müsait değil.");
        return;
      }

      startNewRange(clickedDay);
      return;
    }

    if (canUseAsCheckout(clickedDay)) {
      setCalendarNotice("");
      setRange({ from: range.from, to: clickedDay });
      setCalendarOpen(false);
      return;
    }

    if (canStartOn(clickedDay)) {
      startNewRange(
        clickedDay,
        "Yeni giriş tarihi seçildi. Şimdi çıkış tarihini seçin.",
      );
      return;
    }

    setCalendarNotice(
      "Bu aralıkta dolu gece olduğu için daha ileri tarih seçilemez.",
    );
  }

  function handleMonthChange(nextMonth: Date) {
    const currentMonthStart = startOfMonth(today);
    const targetMonthStart = startOfMonth(nextMonth);

    if (isBefore(targetMonthStart, currentMonthStart)) {
      setMonth(currentMonthStart);
      return;
    }

    setMonth(targetMonthStart);
  }

  function handleAdultsChange(value: string) {
    const digits = onlyDigits(value);

    if (digits === "") {
      setAdultsInput("");
      return;
    }

    setAdultsInput(String(Math.max(0, Number(digits))));
  }

  function handleChildrenChange(value: string) {
    const digits = onlyDigits(value);

    if (digits === "") {
      setChildrenInput("");
      return;
    }

    setChildrenInput(String(Math.max(0, Number(digits))));
  }

  function updateChildAge(index: number, age: number) {
    setChildAges((current) =>
      current.map((item, i) => (i === index ? age : item)),
    );
  }

  function submit() {
    if (!range?.from || !range?.to) {
      alert("Lütfen giriş ve çıkış tarihini seçin.");
      return;
    }

    if (nights <= 0) {
      alert("Çıkış tarihi giriş tarihinden sonra olmalı.");
      return;
    }

    if (adults <= 0) {
      alert("Lütfen yetişkin sayısını girin.");
      return;
    }

    if (!isRangeSelectable(range.from, range.to)) {
      alert("Seçilen aralıkta dolu gece var.");
      return;
    }

    const params = new URLSearchParams();
    params.set("mode", "exact");
    params.set("checkin", format(range.from, "yyyy-MM-dd"));
    params.set("checkout", format(range.to, "yyyy-MM-dd"));
    params.set("adults", String(adults));
    params.set("children", String(children));
    params.set("breakfast", "false");

    if (childAges.length) {
      params.set("childAges", childAges.join(","));
    }

    router.push(`/results?${params.toString()}`);
  }

  const rangeLabel =
    range?.from && range?.to
      ? `${formatDateForLabel(range.from)} → ${formatDateForLabel(range.to)}`
      : range?.from
        ? `${formatDateForLabel(range.from)} → Çıkış tarihini seçin`
        : "Giriş – Çıkış tarihi seçin";

  const summaryText =
    range?.from && range?.to
      ? `${nights} gece · ${totalGuests} kişi${
          adults > 0 ? ` · ${adults} yetişkin` : ""
        }${children > 0 ? ` · ${children} çocuk` : ""}`
      : "Önce giriş, sonra çıkış tarihini seçin";

  return (
    <section className="kp-search-shell" aria-label="Rezervasyon arama formu">
      <div className="kp-search-card">
        <div className="kp-search-grid">
          <div className="kp-search-field kp-search-date" ref={popoverRef}>
            <label>Giriş & Çıkış Tarihi</label>

            <button
              type="button"
              className="kp-calendar-trigger"
              onClick={() => setCalendarOpen((prev) => !prev)}
            >
              <span className="kp-field-icon">
                <PremiumIcon name="calendar" />
              </span>
              <span className="kp-calendar-text">{rangeLabel}</span>
            </button>

            {calendarOpen ? (
              <>
                <div
                  className="kp-calendar-backdrop"
                  onClick={() => setCalendarOpen(false)}
                />

                <div className="kp-calendar-popover">
                  <div className="kp-calendar-inner">
                    <div className="kp-calendar-headline">
                      <span
                        className="kp-calendar-head-icon"
                        aria-hidden="true"
                      >
                        <PremiumIcon name="calendarCheck" />
                      </span>
                      <div>
                        <strong>Rezervasyon Bilgileri</strong>
                        <small>Canlı müsaitlik ve gecelik fiyat takvimi</small>
                      </div>
                    </div>

                    <div className="kp-calendar-monthbar">
                      <strong>{monthLabel}</strong>

                      <div className="kp-calendar-nav">
                        <button
                          type="button"
                          onClick={() =>
                            handleMonthChange(addMonthsTo(month, -1))
                          }
                          aria-label="Önceki ay"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleMonthChange(addMonthsTo(month, 1))
                          }
                          aria-label="Sonraki ay"
                        >
                          ›
                        </button>
                      </div>
                    </div>

                    <div className="kp-calendar-weekdays" aria-hidden="true">
                      {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map(
                        (dayName) => (
                          <span key={dayName}>{dayName}</span>
                        ),
                      )}
                    </div>

                    <div
                      className="kp-calendar-days"
                      role="grid"
                      aria-label="Rezervasyon takvimi"
                    >
                      {calendarCells.map((cell) => {
                        if (!cell.date || !cell.day) {
                          return (
                            <span
                              key={cell.key}
                              className="kp-calendar-day is-empty"
                              aria-hidden="true"
                            />
                          );
                        }

                        const info = getDayInfo(cell.date);
                        const hasPrice = Boolean(
                          info?.lowestPrice !== null &&
                            info?.lowestPrice !== undefined &&
                            info.availableCount > 0,
                        );
                        const isUnavailable = Boolean(info && !hasPrice);
                        const isSelected = Boolean(
                          (range?.from && isSameDay(cell.date, range.from)) ||
                            (range?.to && isSameDay(cell.date, range.to)),
                        );
                        const isCheckin = Boolean(
                          range?.from && isSameDay(cell.date, range.from),
                        );
                        const isCheckout = Boolean(
                          range?.to && isSameDay(cell.date, range.to),
                        );
                        const isRange = isDateInSelectedRange(cell.date);
                        const isPast = isPastDay(cell.date);
                        const isCheckoutOnly = isCheckoutOnlyDay(cell.date);
                        const disabled = isDayDisabled(cell.date);
                        const priceText = hasPrice
                          ? `₺${formatPrice(info?.lowestPrice ?? null)}`
                          : isCheckoutOnly
                            ? "Çıkış"
                            : isUnavailable
                              ? "Dolu"
                              : "";

                        const className = [
                          "kp-calendar-day",
                          hasPrice ? "has-price" : "",
                          isUnavailable ? "is-unavailable" : "",
                          isSelected ? "is-selected" : "",
                          isCheckin ? "is-checkin" : "",
                          isCheckout ? "is-checkout" : "",
                          isRange ? "is-in-range" : "",
                          isCheckoutOnly ? "is-checkout-only" : "",
                          disabled ? "is-disabled" : "",
                          isPast ? "is-past" : "",
                        ]
                          .filter(Boolean)
                          .join(" ");

                        return (
                          <button
                            key={cell.key}
                            type="button"
                            className={className}
                            disabled={disabled}
                            onClick={() => handleDayClick(cell.date!)}
                            aria-label={`${formatDateForLabel(cell.date)} ${priceText}`}
                          >
                            <strong>{cell.day}</strong>
                            <small>{priceText}</small>
                          </button>
                        );
                      })}
                    </div>

                    <div
                      className="kp-calendar-legend"
                      aria-label="Takvim açıklamaları"
                    >
                      <span>
                        <i className="selected" /> Seçili Tarihler
                      </span>
                      <span>
                        <i className="edge" /> Giriş / Çıkış
                      </span>
                      <span>
                        <i className="closed" /> Dolu
                      </span>
                      <span>Fiyatlar gecelik ₺'dir.</span>
                    </div>

                    <div className="kp-calendar-preview" aria-live="polite">
                      {monthLoading ? (
                        <strong>Fiyatlar güncelleniyor...</strong>
                      ) : calendarNotice ? (
                        <>
                          <strong>{calendarNotice}</strong>
                          <span>Lütfen farklı tarihler deneyin.</span>
                        </>
                      ) : range?.from && range?.to ? (
                        <>
                          <strong>{nights} gece seçildi</strong>
                          <span>
                            {formatDateForLabel(range.from)} →{" "}
                            {formatDateForLabel(range.to)}
                          </span>
                        </>
                      ) : range?.from ? (
                        <>
                          <strong>
                            {formatDateForLabel(range.from)} giriş olarak
                            seçildi
                          </strong>
                          <span>Şimdi çıkış tarihini seçin.</span>
                        </>
                      ) : (
                        <>
                          <strong>
                            En düşük fiyatlar günlerin içinde gösterilir.
                          </strong>
                          <span>Canlı takvim verileri yükleniyor.</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <NumberField
            label="Yetişkin"
            value={adultsInput}
            icon="users"
            min={1}
            onChange={handleAdultsChange}
          />

          <NumberField
            label="Çocuk"
            value={childrenInput}
            icon="child"
            min={0}
            onChange={handleChildrenChange}
          />

          {children > 0 ? (
            <div className="kp-child-ages">
              <strong>Çocuk Yaşları</strong>

              <div className="kp-child-ages-grid">
                {childAges.map((age, index) => (
                  <div key={index} className="kp-search-field">
                    <label>{index + 1}. Çocuk Yaşı</label>
                    <select
                      value={age}
                      onChange={(event) =>
                        updateChildAge(index, Number(event.target.value))
                      }
                      className="kp-age-select"
                    >
                      {Array.from({ length: 13 }).map((_, value) => (
                        <option key={value} value={value}>
                          {value} yaş
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className={`kp-search-actions ${children > 0 ? "has-child-ages" : ""}`}>
            <button type="button" className="kp-search-button" onClick={submit}>
              <PremiumIcon name="search" />
              Müsait Villaları Göster
            </button>
          </div>
        </div>

        <div className="kp-search-foot">
          <span>
            <PremiumIcon name="clock" />
            {summaryText}
          </span>
          <span>
            <PremiumIcon name="wallet" />
            Ek kişi gecelik ₺{formatPrice(EXTRA_GUEST_DAILY_FEE)}
          </span>
          <span>
            <PremiumIcon name="shield" />
            Ücretsiz iptal seçeneği · Güvenli rezervasyon
          </span>
        </div>

      </div>
    </section>
  );
}

function NumberField({
  label,
  value,
  icon,
  min,
  onChange,
}: {
  label: string;
  value: string;
  icon: IconName;
  min: number;
  onChange: (value: string) => void;
}) {
  const numericValue = value === "" ? 0 : Number(value);

  function setNumber(nextValue: number) {
    onChange(String(Math.max(min, nextValue)));
  }

  return (
    <div className="kp-search-field">
      <label>{label}</label>

      <div className="kp-number-control">
        <span className="kp-field-icon">
          <PremiumIcon name={icon} />
        </span>

        <button
          type="button"
          onClick={() => setNumber(numericValue - 1)}
          disabled={numericValue <= min}
        >
          <PremiumIcon name="minus" />
        </button>

        <input
          type="number"
          min={min}
          inputMode="numeric"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
        />

        <button type="button" onClick={() => setNumber(numericValue + 1)}>
          <PremiumIcon name="plus" />
        </button>
      </div>
    </div>
  );
}

function TrustStrip() {
  return (
    <section className="kp-trust-strip">
      <div className="kp-container kp-trust-inner">
        {trustItems.map((item) => (
          <article className="kp-trust-item" key={item.title}>
            <span className="kp-trust-icon">
              <PremiumIcon name={item.icon} />
            </span>

            <span>
              <strong>{item.title}</strong>
              <small>{item.text}</small>
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

function PremiumPropertyCard({
  property,
  queryString,
  liveCardMeta,
  priorityLabel,
}: {
  property: Property;
  queryString: string;
  liveCardMeta?: PropertyLiveCardMeta;
  priorityLabel: string;
}) {
  const fallbackStartingPrice = Math.min(
    property.rates.weekday,
    property.rates.weekend,
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
  const chips = getExperienceChips(property);
  const reviewScore = property.reviewScore ?? 4.9;
  const imageCount = getImageCount(property);

  return (
    <Link
      href={`/properties/${property.slug}?${queryString}`}
      className="kp-property-card"
      aria-label={`${property.name} detaylarını gör`}
    >
      <div className="kp-property-cover">
        <img src={property.heroImage} alt={property.name} loading="lazy" />
        <div className="kp-property-cover-shade" />

        <div className="kp-property-topline">
          <span className="kp-property-badge">{priorityLabel}</span>
          <span className="kp-property-save" aria-hidden="true">
            <PremiumIcon name="heart" />
          </span>
        </div>

        <div className="kp-property-cover-bottom">
          <div className="kp-property-score">
            <PremiumIcon name="star" />
            <strong>{reviewScore.toFixed(1)}</strong>
          </div>

          <div className="kp-property-photo-count">
            <PremiumIcon name="camera" />
            <span>{imageCount}</span>
          </div>
        </div>
      </div>

      <div className="kp-property-body">
        <div className="kp-property-title-row">
          <div>
            <h3>{property.name}</h3>
            <p>{property.tagline}</p>
          </div>
        </div>

        <div className="kp-property-meta">
          <span>{property.maxGuests} kişi</span>
          <span>{property.layout}</span>
          <span>{getBreakfastLabel(property)}</span>
        </div>

        <div className="kp-property-chips">
          {chips.map((chip) => (
            <span key={chip.text}>
              <PremiumIcon name={chip.icon} />
              {chip.text}
            </span>
          ))}
        </div>

        <div className="kp-property-price-area">
          <div>
            {bestPriceDate ? (
              <p className="kp-property-date">
                En uygun tarih:{" "}
                <strong>{formatDisplayDate(bestPriceDate)}</strong>
              </p>
            ) : (
              <p className="kp-property-date">Gecelik başlangıç</p>
            )}

            {firstAvailableDate && bestPriceDate !== firstAvailableDate ? (
              <p className="kp-property-date muted">
                En yakın uygun:{" "}
                <strong>{formatDisplayDate(firstAvailableDate)}</strong>
              </p>
            ) : null}

            <div className="kp-price-line">
              <strong>{formatCurrency(startingPrice)}</strong>
              <span>/ gece</span>
            </div>

            <small>
              {getBaseGuestLabel(property.slug)} · Ek kişi gecelik{" "}
              {formatCurrency(EXTRA_GUEST_DAILY_FEE)}
            </small>
          </div>

          <span className="kp-details-button">
            Detayları İncele
            <PremiumIcon name="arrow" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function FeatureStrip() {
  return (
    <section
      id="deneyimler"
      className="kp-container kp-feature-strip"
      aria-label="Kule Sapanca premium deneyim özellikleri"
    >
      {featureItems.map((feature) => (
        <article className="kp-feature-item" key={feature.title}>
          <span className="kp-feature-icon">
            <PremiumIcon name={feature.icon} />
          </span>

          <span>
            <strong>{feature.title}</strong>
            <small>{feature.text}</small>
          </span>
        </article>
      ))}
    </section>
  );
}

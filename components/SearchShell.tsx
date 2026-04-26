"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  DayButton,
  DayPicker,
  type DateRange,
  type DayButtonProps
} from "react-day-picker";
import { tr } from "date-fns/locale";
import {
  differenceInCalendarDays,
  format,
  isBefore,
  isSameDay,
  startOfDay,
  startOfMonth
} from "date-fns";
import { useRouter } from "next/navigation";

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

type IconName =
  | "calendar"
  | "users"
  | "child"
  | "search"
  | "shield"
  | "wallet"
  | "sparkles"
  | "clock"
  | "chevronLeft"
  | "chevronRight"
  | "plus"
  | "minus"
  | "lock"
  | "star";

const PREFETCH_MONTH_COUNT = 12;
const EXTRA_GUEST_DAILY_FEE = 500;

function PremiumIcon({ name }: { name: IconName }) {
  const commonProps = {
    className: "home-premium-svg-icon",
    viewBox: "0 0 24 24",
    "aria-hidden": true,
    fill: "none"
  } as const;

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
        <path
          d="m8.4 14.5 2.1 2 4.8-5"
          stroke="currentColor"
          strokeWidth="1.8"
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

  if (name === "child") {
    return (
      <svg {...commonProps}>
        <path
          d="M12 10.8a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M6.2 20c.6-3.5 2.7-5.5 5.8-5.5s5.2 2 5.8 5.5M8.4 13.2l-2.2 2.2M15.6 13.2l2.2 2.2"
          stroke="currentColor"
          strokeWidth="1.8"
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
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "chevronLeft") {
    return (
      <svg {...commonProps}>
        <path
          d="m14.5 6-6 6 6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "chevronRight") {
    return (
      <svg {...commonProps}>
        <path
          d="m9.5 6 6 6-6 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
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
      availableProperties: item.availableProperties ?? []
    };
  }

  return mapped;
}

function formatPrice(price?: number | null) {
  if (!price || price <= 0) return "";
  return new Intl.NumberFormat("tr-TR").format(price);
}

export function SearchShell() {
  const router = useRouter();
  const popoverRef = useRef<HTMLDivElement | null>(null);

  const today = useMemo(() => startOfDay(new Date()), []);
  const [isMobile, setIsMobile] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [month, setMonth] = useState<Date>(today);
  const [range, setRange] = useState<DateRange | undefined>(undefined);

  const [monthLoading, setMonthLoading] = useState(false);
  const [monthData, setMonthData] = useState<DayPriceMap>({});
  const [monthCache, setMonthCache] = useState<Partial<Record<string, DayPriceMap>>>({});

  const cacheRef = useRef<Partial<Record<string, DayPriceMap>>>({});
  const inFlightRef = useRef<Partial<Record<string, Promise<DayPriceMap>>>>({});

  const [adultsInput, setAdultsInput] = useState<string>("2");
  const [childrenInput, setChildrenInput] = useState<string>("0");
  const [childAges, setChildAges] = useState<number[]>([]);
  const [calendarNotice, setCalendarNotice] = useState<string>("");

  const adults = adultsInput === "" ? 0 : Math.max(0, Number(adultsInput));
  const children = childrenInput === "" ? 0 : Math.max(0, Number(childrenInput));
  const totalGuests = adults + children;
  const monthKey = useMemo(() => toMonthKey(month), [month]);

  const nights =
    range?.from && range?.to
      ? Math.max(0, differenceInCalendarDays(range.to, range.from))
      : 0;

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

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
        ...Array.from({ length: safeChildren - current.length }, () => 0)
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

    if (cachedMonth) {
      return cachedMonth;
    }

    const existingRequest = inFlightRef.current[targetMonthKey];

    if (existingRequest) {
      return existingRequest;
    }

    const request = (async () => {
      try {
        const res = await fetch(`/api/calendar-preview?month=${targetMonthKey}`, {
          cache: "no-store"
        });

        const data = (await res.json()) as MonthPreviewResponse;

        if (!data?.ok || !data.days) {
          return {};
        }

        const mapped = buildMonthMap(data);

        cacheRef.current = {
          ...cacheRef.current,
          [targetMonthKey]: mapped
        };

        setMonthCache((current) =>
          current[targetMonthKey]
            ? current
            : {
                ...current,
                [targetMonthKey]: mapped
              }
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
      const targetKeys = Array.from({ length: PREFETCH_MONTH_COUNT }, (_, index) =>
        toMonthKey(addMonthsTo(baseMonth, index))
      );

      await Promise.allSettled(
        targetKeys.map(async (key) => {
          if (cacheRef.current[key]) return;
          await fetchMonthMap(key);
        })
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

  function isRangeSelectable(from: Date, to: Date) {
    const start = startOfDay(from);
    const end = startOfDay(to);

    if (!(start < end)) return false;
    if (!canStartOn(start)) return false;

    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());

    while (cursor < end) {
      if (!canStartOn(cursor)) return false;
      cursor.setDate(cursor.getDate() + 1);
    }

    return true;
  }

  function isDayDisabled(date: Date) {
    const day = startOfDay(date);

    if (isPastDay(day)) return true;

    if (!range?.from || range.to) {
      return !canStartOn(day);
    }

    return day <= range.from;
  }

  function handleDayClick(day: Date) {
    const clickedDay = startOfDay(day);

    if (!range?.from || (range.from && range.to)) {
      if (!canStartOn(clickedDay)) {
        setCalendarNotice("Bu tarih giriş için müsait değil.");
        return;
      }

      setCalendarNotice("");
      setRange({ from: clickedDay, to: undefined });
      return;
    }

    if (isSameDay(clickedDay, range.from)) {
      setCalendarNotice("");
      setRange({ from: clickedDay, to: undefined });
      return;
    }

    if (isBefore(clickedDay, range.from)) {
      if (!canStartOn(clickedDay)) {
        setCalendarNotice("Bu tarih giriş için müsait değil.");
        return;
      }

      setCalendarNotice("");
      setRange({ from: clickedDay, to: undefined });
      return;
    }

    if (!isRangeSelectable(range.from, clickedDay)) {
      setCalendarNotice("Arada dolu gece olduğu için bu aralık seçilemez.");
      return;
    }

    setCalendarNotice("");
    setRange({ from: range.from, to: clickedDay });
    setCalendarOpen(false);
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
      current.map((item, i) => (i === index ? age : item))
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

  function PriceDayButton(props: DayButtonProps) {
    const date = props.day.date;
    const dateKey = toDateKey(date);
    const item = monthData[dateKey];

    const isOutside = Boolean(props.modifiers.outside);
    const isSelected = Boolean(
      props.modifiers.selected ||
        props.modifiers.range_start ||
        props.modifiers.range_end
    );
    const isInRange = Boolean(props.modifiers.range_middle);
    const isDisabled = Boolean(props.modifiers.disabled);

    const priceText =
      !isOutside && item?.lowestPrice !== null && item?.lowestPrice !== undefined
        ? `₺${formatPrice(item.lowestPrice)}`
        : !isOutside && item
          ? "Dolu"
          : "";

    return (
      <DayButton
        {...props}
        className={`${props.className ?? ""} home-premium-price-day-button`}
        style={{
          ...(props.style ?? {}),
          width: "100%",
          minWidth: 0,
          height: "100%",
          minHeight: isMobile ? "44px" : "62px",
          padding: isMobile ? "3px 2px" : "7px 4px",
          borderRadius: isMobile ? "13px" : "18px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: isMobile ? "3px" : "6px",
          border: isSelected
            ? "1px solid rgba(255,255,255,0.35)"
            : "1px solid transparent",
          background: isSelected
            ? "linear-gradient(145deg, #075b3e, #043625)"
            : isInRange
              ? "rgba(7,91,62,0.1)"
              : "transparent",
          color: isSelected ? "#ffffff" : isOutside ? "#b8b8b8" : "#15130f",
          boxShadow: isSelected ? "0 12px 24px rgba(7,91,62,0.22)" : "none",
          opacity: isDisabled ? 0.42 : 1
        }}
      >
        <span
          style={{
            fontSize: isMobile ? 13 : 16,
            fontWeight: 900,
            lineHeight: 1
          }}
        >
          {date.getDate()}
        </span>

        <span
          style={{
            minHeight: isMobile ? 9 : 12,
            fontSize: isMobile ? 8 : 10,
            fontWeight: 900,
            lineHeight: 1,
            color: isSelected
              ? "rgba(255,255,255,0.92)"
              : item?.lowestPrice !== null && item?.lowestPrice !== undefined
                ? "#0f766e"
                : priceText
                  ? "#b45309"
                  : isOutside
                    ? "#b8b8b8"
                    : "#6b7280"
          }}
        >
          {priceText}
        </span>
      </DayButton>
    );
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
    <section
      className="home-premium-search-shell"
      aria-label="Premium villa rezervasyon arama formu"
    >
      <div className="home-premium-search-glow home-premium-search-glow-left" />
      <div className="home-premium-search-glow home-premium-search-glow-right" />

      <div className="home-premium-search-card">
        <div className="home-premium-search-head">
          <div>
            <span className="home-premium-search-badge">
              <PremiumIcon name="sparkles" />
              Canlı müsaitlik & fiyat kontrolü
            </span>

            <h2>Premium villa deneyiminizi planlayın</h2>
          </div>

          <div className="home-premium-search-mini-note">
            <PremiumIcon name="star" />
            <span>Özel havuzlu ve mahrem villalar</span>
          </div>
        </div>

        <div className="home-premium-search-grid">
          <div className="home-premium-search-field home-premium-search-date" ref={popoverRef}>
            <label>Giriş & Çıkış Tarihi</label>

            <button
              type="button"
              className="home-premium-calendar-trigger"
              onClick={() => setCalendarOpen((prev) => !prev)}
            >
              <span className="home-premium-field-icon">
                <PremiumIcon name="calendar" />
              </span>

              <span className="home-premium-calendar-copy">
                <strong>{rangeLabel}</strong>
                <small>Canlı takvimden tarih seçin</small>
              </span>
            </button>

            {calendarOpen ? (
              <>
                <div
                  className="home-premium-calendar-backdrop"
                  onClick={() => setCalendarOpen(false)}
                />

                <div className="home-premium-calendar-popover">
                  <div className="home-premium-calendar-inner">
                    <div className="home-premium-calendar-head">
                      <div>
                        <strong>Tarih Seçimi</strong>
                        <span>Gün içindeki fiyatlar en düşük müsait fiyatı gösterir.</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setCalendarOpen(false)}
                        aria-label="Takvimi kapat"
                      >
                        ×
                      </button>
                    </div>

                    <DayPicker
                      mode="range"
                      locale={tr}
                      month={month}
                      onMonthChange={handleMonthChange}
                      selected={range}
                      onDayClick={handleDayClick}
                      disabled={isDayDisabled}
                      showOutsideDays
                      numberOfMonths={1}
                      fixedWeeks
                      styles={{
                        root: { width: "100%" },
                        month: { width: "100%" },
                        month_grid: {
                          width: "100%",
                          borderCollapse: "separate",
                          tableLayout: "fixed"
                        },
                        weekdays: { width: "100%" },
                        week: { width: "100%" },
                        day: {
                          textAlign: "center",
                          verticalAlign: "middle",
                          padding: isMobile ? "1px" : "4px"
                        },
                        day_button: {
                          width: "100%",
                          padding: 0,
                          background: "transparent",
                          border: "none"
                        }
                      }}
                      components={{
                        DayButton: PriceDayButton
                      }}
                    />

                    <div className="home-premium-calendar-preview" aria-live="polite">
                      {monthLoading ? (
                        <>
                          <strong>Fiyatlar güncelleniyor...</strong>
                          <span>Canlı takvim verileri kontrol ediliyor.</span>
                        </>
                      ) : calendarNotice ? (
                        <>
                          <strong>{calendarNotice}</strong>
                          <span>Lütfen farklı tarihler deneyin.</span>
                        </>
                      ) : range?.from && range?.to ? (
                        <>
                          <strong>{nights} gece seçildi</strong>
                          <span>
                            {formatDateForLabel(range.from)} → {formatDateForLabel(range.to)}
                          </span>
                        </>
                      ) : range?.from ? (
                        <>
                          <strong>{formatDateForLabel(range.from)} giriş olarak seçildi</strong>
                          <span>Şimdi çıkış tarihini seçin.</span>
                        </>
                      ) : (
                        <>
                          <strong>En düşük fiyatlar günlerin içinde gösterilir.</strong>
                          <span>Müsait günlerden giriş ve çıkış tarihinizi seçin.</span>
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
            hint="12 yaş ve üzeri"
            value={adultsInput}
            icon="users"
            min={0}
            onChange={handleAdultsChange}
          />

          <NumberField
            label="Çocuk"
            hint="0 - 12 yaş"
            value={childrenInput}
            icon="child"
            min={0}
            onChange={handleChildrenChange}
          />

          <div className="home-premium-search-actions">
            <button type="button" className="home-premium-search-button" onClick={submit}>
              <PremiumIcon name="search" />
              <span>Müsait Villaları Göster</span>
            </button>
          </div>
        </div>

        <div className="home-premium-search-foot">
          <span>
            <PremiumIcon name="clock" />
            {summaryText}
          </span>

          <span>
            <PremiumIcon name="wallet" />
            Ek kişi: kişi başı gecelik ₺{formatPrice(EXTRA_GUEST_DAILY_FEE)}
          </span>

          <span>
            <PremiumIcon name="lock" />
            Ödeme alınmadan ön rezervasyon talebi oluşturulur.
          </span>
        </div>

        {children > 0 ? (
          <div className="home-premium-child-ages">
            <div className="home-premium-child-ages-head">
              <strong>Çocuk Yaşları</strong>
              <span>Rezervasyon bilgisinin doğru hazırlanması için yaş seçiniz.</span>
            </div>

            <div className="home-premium-child-ages-grid">
              {childAges.map((age, index) => (
                <div key={index} className="home-premium-search-field">
                  <label>{index + 1}. Çocuk Yaşı</label>

                  <select
                    value={age}
                    onChange={(event) => updateChildAge(index, Number(event.target.value))}
                    className="home-premium-age-select"
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
      </div>

      <style jsx>{`
        .home-premium-search-shell {
          position: relative;
          z-index: 30;
          width: 100%;
          overflow: visible;
        }

        .home-premium-search-glow {
          position: absolute;
          z-index: -1;
          width: 240px;
          height: 240px;
          border-radius: 999px;
          filter: blur(50px);
          opacity: 0.32;
          pointer-events: none;
        }

        .home-premium-search-glow-left {
          left: -70px;
          top: -60px;
          background: rgba(13, 148, 105, 0.52);
        }

        .home-premium-search-glow-right {
          right: -60px;
          bottom: -80px;
          background: rgba(212, 175, 55, 0.34);
        }

        .home-premium-search-card {
          position: relative;
          overflow: visible;
          border: 1px solid rgba(255, 255, 255, 0.72);
          border-radius: 34px;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 245, 235, 0.96)),
            #ffffff;
          box-shadow:
            0 34px 90px rgba(20, 15, 5, 0.18),
            inset 0 1px 0 rgba(255, 255, 255, 0.92);
          padding: 24px;
          backdrop-filter: blur(18px);
        }

        .home-premium-search-card::before {
          content: "";
          position: absolute;
          inset: 1px;
          z-index: -1;
          border-radius: 33px;
          background:
            radial-gradient(circle at 10% 0%, rgba(7, 91, 62, 0.12), transparent 30%),
            radial-gradient(circle at 90% 0%, rgba(212, 175, 55, 0.14), transparent 28%);
          pointer-events: none;
        }

        .home-premium-search-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 20px;
        }

        .home-premium-search-badge,
        .home-premium-search-mini-note,
        .home-premium-search-foot span {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .home-premium-search-badge {
          margin-bottom: 10px;
          border: 1px solid rgba(7, 91, 62, 0.12);
          border-radius: 999px;
          background: rgba(7, 91, 62, 0.07);
          color: #075b3e;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        .home-premium-search-head h2 {
          margin: 0;
          color: #15130f;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(24px, 3vw, 36px);
          line-height: 1.05;
          letter-spacing: -0.04em;
        }

        .home-premium-search-mini-note {
          flex-shrink: 0;
          border: 1px solid rgba(212, 175, 55, 0.22);
          border-radius: 999px;
          background: rgba(212, 175, 55, 0.1);
          color: #6f5512;
          padding: 10px 13px;
          font-size: 13px;
          font-weight: 850;
          white-space: nowrap;
        }

        .home-premium-search-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1.7fr)
            minmax(150px, 0.72fr)
            minmax(150px, 0.72fr)
            minmax(240px, 0.98fr);
          gap: 16px;
          align-items: end;
        }

        .home-premium-search-field {
          position: relative;
          min-width: 0;
        }

        .home-premium-search-date {
          z-index: 45;
        }

        .home-premium-search-field label {
          display: block;
          margin-bottom: 9px;
          color: rgba(21, 19, 15, 0.58);
          font-size: 12px;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .home-premium-calendar-trigger,
        .home-premium-number-control,
        .home-premium-age-select {
          width: 100%;
          min-height: 64px;
          border: 1px solid rgba(21, 19, 15, 0.1);
          border-radius: 21px;
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(255, 255, 255, 0.9)),
            #ffffff;
          color: #15130f;
          outline: none;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.95);
          transition:
            border 180ms ease,
            box-shadow 180ms ease,
            transform 180ms ease;
        }

        .home-premium-calendar-trigger {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 0 18px;
          text-align: left;
        }

        .home-premium-calendar-trigger:hover,
        .home-premium-calendar-trigger:focus-visible,
        .home-premium-number-control:hover,
        .home-premium-number-control:focus-within,
        .home-premium-age-select:focus {
          border-color: rgba(7, 91, 62, 0.45);
          box-shadow:
            0 0 0 4px rgba(7, 91, 62, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.95);
        }

        .home-premium-field-icon {
          display: grid;
          flex: 0 0 auto;
          width: 42px;
          height: 42px;
          place-items: center;
          border-radius: 16px;
          background: rgba(7, 91, 62, 0.08);
          color: #075b3e;
        }

        .home-premium-calendar-copy {
          display: flex;
          min-width: 0;
          flex-direction: column;
          gap: 4px;
        }

        .home-premium-calendar-copy strong {
          overflow: hidden;
          color: #15130f;
          font-size: 16px;
          font-weight: 950;
          line-height: 1.1;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .home-premium-calendar-copy small {
          color: rgba(21, 19, 15, 0.52);
          font-size: 12px;
          font-weight: 750;
        }

        .home-premium-number-control {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 0 12px;
        }

        .home-premium-number-copy {
          display: flex;
          min-width: 0;
          flex: 1;
          flex-direction: column;
          gap: 2px;
        }

        .home-premium-number-copy strong {
          color: #15130f;
          font-size: 18px;
          font-weight: 950;
          line-height: 1;
        }

        .home-premium-number-copy small {
          color: rgba(21, 19, 15, 0.52);
          font-size: 11px;
          font-weight: 760;
        }

        .home-premium-number-control input {
          width: 44px;
          border: 0;
          outline: 0;
          background: transparent;
          text-align: center;
          color: #15130f;
          font-size: 18px;
          font-weight: 950;
        }

        .home-premium-number-control input::-webkit-outer-spin-button,
        .home-premium-number-control input::-webkit-inner-spin-button {
          margin: 0;
          appearance: none;
        }

        .home-premium-stepper {
          display: grid;
          width: 34px;
          height: 34px;
          flex: 0 0 auto;
          place-items: center;
          border: 0;
          border-radius: 999px;
          background: rgba(7, 91, 62, 0.08);
          color: #075b3e;
          cursor: pointer;
          transition:
            transform 160ms ease,
            background 160ms ease;
        }

        .home-premium-stepper:hover {
          transform: translateY(-1px);
          background: rgba(7, 91, 62, 0.13);
        }

        .home-premium-stepper:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          transform: none;
        }

        .home-premium-search-button {
          display: inline-flex;
          width: 100%;
          min-height: 64px;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 0;
          border-radius: 21px;
          background:
            linear-gradient(145deg, #08714e, #053b2a),
            #075b3e;
          color: #fff;
          cursor: pointer;
          font-size: 15px;
          font-weight: 950;
          letter-spacing: -0.01em;
          box-shadow:
            0 20px 42px rgba(7, 91, 62, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            filter 160ms ease;
        }

        .home-premium-search-button:hover {
          transform: translateY(-1px);
          filter: saturate(1.08);
          box-shadow:
            0 25px 52px rgba(7, 91, 62, 0.34),
            inset 0 1px 0 rgba(255, 255, 255, 0.22);
        }

        .home-premium-search-foot {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 16px;
          color: rgba(21, 19, 15, 0.62);
          font-size: 13px;
          font-weight: 800;
        }

        .home-premium-search-foot span {
          border: 1px solid rgba(21, 19, 15, 0.08);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.62);
          padding: 8px 11px;
        }

        .home-premium-child-ages {
          margin-top: 20px;
          border-top: 1px solid rgba(21, 19, 15, 0.08);
          padding-top: 18px;
        }

        .home-premium-child-ages-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 13px;
        }

        .home-premium-child-ages-head strong {
          color: #15130f;
          font-size: 15px;
          font-weight: 950;
        }

        .home-premium-child-ages-head span {
          color: rgba(21, 19, 15, 0.55);
          font-size: 12px;
          font-weight: 750;
        }

        .home-premium-child-ages-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .home-premium-age-select {
          padding: 0 15px;
          font-size: 15px;
          font-weight: 850;
        }

        .home-premium-calendar-backdrop {
          position: fixed;
          inset: 0;
          z-index: 79;
          background: rgba(15, 23, 42, 0.22);
          backdrop-filter: blur(4px);
        }

        .home-premium-calendar-popover {
          position: absolute;
          left: 0;
          top: calc(100% + 14px);
          z-index: 80;
          width: min(460px, calc(100vw - 48px));
          max-width: calc(100vw - 48px);
        }

        .home-premium-calendar-inner {
          width: 100%;
          border: 1px solid rgba(21, 19, 15, 0.08);
          border-radius: 30px;
          background:
            radial-gradient(circle at 20% 0%, rgba(7, 91, 62, 0.08), transparent 32%),
            #ffffff;
          box-shadow:
            0 28px 74px rgba(15, 23, 42, 0.22),
            inset 0 1px 0 rgba(255, 255, 255, 0.92);
          padding: 17px 17px 13px;
        }

        .home-premium-calendar-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
          border-bottom: 1px solid rgba(21, 19, 15, 0.08);
          padding-bottom: 12px;
        }

        .home-premium-calendar-head strong {
          display: block;
          color: #15130f;
          font-size: 16px;
          font-weight: 950;
        }

        .home-premium-calendar-head span {
          display: block;
          margin-top: 3px;
          color: rgba(21, 19, 15, 0.56);
          font-size: 12px;
          font-weight: 750;
        }

        .home-premium-calendar-head button {
          display: grid;
          width: 34px;
          height: 34px;
          place-items: center;
          border: 0;
          border-radius: 999px;
          background: rgba(21, 19, 15, 0.06);
          color: #15130f;
          cursor: pointer;
          font-size: 24px;
          line-height: 1;
        }

        .home-premium-calendar-preview {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-top: 12px;
          border-top: 1px solid rgba(21, 19, 15, 0.08);
          padding-top: 13px;
        }

        .home-premium-calendar-preview strong {
          color: #15130f;
          font-size: 15px;
          font-weight: 950;
        }

        .home-premium-calendar-preview span {
          color: rgba(21, 19, 15, 0.58);
          font-size: 13px;
          font-weight: 720;
        }

        :global(.home-premium-svg-icon) {
          width: 20px;
          height: 20px;
          flex: 0 0 auto;
        }

        :global(.home-premium-price-day-button) {
          cursor: pointer;
        }

        :global(.home-premium-price-day-button:hover) {
          background: rgba(7, 91, 62, 0.07) !important;
        }

        :global(.rdp-root) {
          --rdp-accent-color: #075b3e;
          --rdp-background-color: rgba(7, 91, 62, 0.08);
          width: 100%;
          margin: 0;
        }

        :global(.rdp-months),
        :global(.rdp-month),
        :global(.rdp-month_grid),
        :global(.rdp-weekdays) {
          width: 100%;
        }

        :global(.rdp-month_grid) {
          border-collapse: separate;
          table-layout: fixed;
        }

        :global(.rdp-month_caption) {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          padding: 2px 0 4px;
        }

        :global(.rdp-caption_label) {
          color: #15130f;
          font-size: 16px;
          font-weight: 950;
          text-transform: capitalize;
        }

        :global(.rdp-nav) {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        :global(.rdp-button_previous),
        :global(.rdp-button_next) {
          width: 34px;
          height: 34px;
          border: 1px solid rgba(21, 19, 15, 0.1);
          border-radius: 999px;
          background: #ffffff;
          color: #15130f;
        }

        :global(.rdp-weekday) {
          color: rgba(21, 19, 15, 0.55);
          font-size: 12px;
          font-weight: 900;
          padding-bottom: 4px;
        }

        :global(.rdp-outside) {
          opacity: 0.42;
        }

        :global(.rdp-disabled) {
          opacity: 0.38;
        }

        @media (max-width: 1120px) {
          .home-premium-search-head {
            flex-direction: column;
          }

          .home-premium-search-mini-note {
            white-space: normal;
          }

          .home-premium-search-grid {
            grid-template-columns: 1fr 1fr;
          }

          .home-premium-search-date,
          .home-premium-search-actions {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 767px) {
          .home-premium-search-card {
            border-radius: 25px;
            padding: 15px;
          }

          .home-premium-search-head {
            margin-bottom: 16px;
          }

          .home-premium-search-head h2 {
            font-size: 24px;
          }

          .home-premium-search-badge {
            align-items: flex-start;
            border-radius: 18px;
            white-space: normal;
          }

          .home-premium-search-grid {
            grid-template-columns: 1fr;
          }

          .home-premium-calendar-trigger,
          .home-premium-number-control,
          .home-premium-age-select,
          .home-premium-search-button {
            min-height: 58px;
            border-radius: 18px;
          }

          .home-premium-field-icon {
            width: 38px;
            height: 38px;
            border-radius: 14px;
          }

          .home-premium-calendar-popover {
            position: fixed;
            left: 50%;
            top: 50%;
            width: min(92vw, 350px);
            max-height: 84dvh;
            transform: translate(-50%, -50%);
          }

          .home-premium-calendar-inner {
            max-height: 84dvh;
            overflow: auto;
            border-radius: 22px;
            padding: 11px 11px 9px;
          }

          .home-premium-child-ages-head {
            align-items: flex-start;
            flex-direction: column;
          }

          .home-premium-child-ages-grid {
            grid-template-columns: 1fr;
          }

          .home-premium-search-foot {
            justify-content: flex-start;
            font-size: 12px;
          }

          .home-premium-search-foot span {
            width: 100%;
            justify-content: flex-start;
            border-radius: 16px;
          }

          :global(.rdp-caption_label) {
            font-size: 14px;
          }

          :global(.rdp-weekday) {
            font-size: 10px;
            padding-bottom: 3px;
          }

          :global(.home-premium-price-day-button) {
            min-height: 44px !important;
            border-radius: 13px !important;
            gap: 3px !important;
          }

          :global(.rdp-button_previous),
          :global(.rdp-button_next) {
            width: 28px;
            height: 28px;
          }
        }
      `}</style>
    </section>
  );
}

function NumberField({
  label,
  hint,
  value,
  icon,
  min,
  onChange
}: {
  label: string;
  hint: string;
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
    <div className="home-premium-search-field">
      <label>{label}</label>

      <div className="home-premium-number-control">
        <span className="home-premium-field-icon">
          <PremiumIcon name={icon} />
        </span>

        <span className="home-premium-number-copy">
          <strong>{value === "" ? "0" : value}</strong>
          <small>{hint}</small>
        </span>

        <button
          type="button"
          className="home-premium-stepper"
          onClick={() => setNumber(numericValue - 1)}
          disabled={numericValue <= min}
          aria-label={`${label} azalt`}
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

        <button
          type="button"
          className="home-premium-stepper"
          onClick={() => setNumber(numericValue + 1)}
          aria-label={`${label} artır`}
        >
          <PremiumIcon name="plus" />
        </button>
      </div>
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";

type CalendarPriceItem = {
  date: string;
  lowestPrice: number | null;
  availableCount: number;
};

type PricesByDate = Record<string, CalendarPriceItem>;

type AvailabilityCalendarProps = {
  className?: string;
  initialCheckIn?: string | null;
  initialCheckOut?: string | null;
  onDatesChange?: (payload: {
    checkIn: string | null;
    checkOut: string | null;
  }) => void;
};

type CalendarCell = {
  date: Date;
  inCurrentMonth: boolean;
};

const WEEKDAY_LABELS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseIsoDate(value?: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function formatMonthLabel(date: Date) {
  const label = new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric"
  }).format(date);

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatLongDate(date: Date | null) {
  if (!date) return "";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatPrice(price: number | null) {
  if (price === null) return "Dolu";
  return `₺${price.toLocaleString("tr-TR")}`;
}

function isSameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBeforeDay(a: Date, b: Date) {
  return startOfDay(a).getTime() < startOfDay(b).getTime();
}

function buildCalendarCells(visibleMonth: Date) {
  const year = visibleMonth.getFullYear();
  const monthIndex = visibleMonth.getMonth();

  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0);

  const firstWeekdayIndex = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = lastDayOfMonth.getDate();

  const cells: CalendarCell[] = [];

  for (let i = firstWeekdayIndex; i > 0; i -= 1) {
    cells.push({
      date: new Date(year, monthIndex, 1 - i),
      inCurrentMonth: false
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      date: new Date(year, monthIndex, day),
      inCurrentMonth: true
    });
  }

  while (cells.length % 7 !== 0) {
    const nextDay = cells.length - (firstWeekdayIndex + daysInMonth) + 1;

    cells.push({
      date: new Date(year, monthIndex + 1, nextDay),
      inCurrentMonth: false
    });
  }

  return cells;
}

export default function AvailabilityCalendar({
  className = "",
  initialCheckIn = null,
  initialCheckOut = null,
  onDatesChange
}: AvailabilityCalendarProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const initialDate = parseIsoDate(initialCheckIn);
    return initialDate ? startOfDay(initialDate) : startOfDay(new Date());
  });

  const [checkIn, setCheckIn] = useState<Date | null>(() =>
    parseIsoDate(initialCheckIn)
  );

  const [checkOut, setCheckOut] = useState<Date | null>(() =>
    parseIsoDate(initialCheckOut)
  );

  const [pricesByDate, setPricesByDate] = useState<PricesByDate>({});
  const [monthCache, setMonthCache] = useState<Record<string, PricesByDate>>({});
  const [loadingMonth, setLoadingMonth] = useState(false);

  const monthKey = useMemo(() => formatMonthKey(visibleMonth), [visibleMonth]);

  const calendarCells = useMemo(
    () => buildCalendarCells(visibleMonth),
    [visibleMonth]
  );

  useEffect(() => {
    onDatesChange?.({
      checkIn: checkIn ? formatDateKey(checkIn) : null,
      checkOut: checkOut ? formatDateKey(checkOut) : null
    });
  }, [checkIn, checkOut, onDatesChange]);

  useEffect(() => {
    let cancelled = false;

    async function loadMonthPrices() {
      if (monthCache[monthKey]) {
        setPricesByDate(monthCache[monthKey]);
        return;
      }

      try {
        setLoadingMonth(true);

        const response = await fetch(`/api/calendar-preview?month=${monthKey}`, {
          cache: "no-store"
        });

        const data = await response.json();

        if (cancelled) return;

        if (!data?.ok) {
          setPricesByDate({});
          return;
        }

        const mapped: PricesByDate = {};

        for (const item of data.days ?? []) {
          mapped[item.date] = {
            date: item.date,
            lowestPrice: item.lowestPrice,
            availableCount: item.availableCount
          };
        }

        setPricesByDate(mapped);

        setMonthCache((prev) => ({
          ...prev,
          [monthKey]: mapped
        }));
      } catch {
        if (!cancelled) {
          setPricesByDate({});
        }
      } finally {
        if (!cancelled) {
          setLoadingMonth(false);
        }
      }
    }

    loadMonthPrices();

    return () => {
      cancelled = true;
    };
  }, [monthKey, monthCache]);

  function handlePrevMonth() {
    setVisibleMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  }

  function handleNextMonth() {
    setVisibleMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  }

  function handleDayClick(day: Date, disabled: boolean) {
    if (disabled) return;

    const clicked = startOfDay(day);

    if (!checkIn && !checkOut) {
      setCheckIn(clicked);
      setCheckOut(null);
      return;
    }

    if (checkIn && !checkOut) {
      if (isBeforeDay(clicked, checkIn) || isSameDay(clicked, checkIn)) {
        setCheckIn(clicked);
        setCheckOut(null);
        return;
      }

      setCheckOut(clicked);
      return;
    }

    setCheckIn(clicked);
    setCheckOut(null);
  }

  function isInSelectedRange(day: Date) {
    if (!checkIn || !checkOut) return false;

    const time = startOfDay(day).getTime();

    return (
      time > startOfDay(checkIn).getTime() &&
      time < startOfDay(checkOut).getTime()
    );
  }

  const nights =
    checkIn && checkOut
      ? Math.round(
          (startOfDay(checkOut).getTime() - startOfDay(checkIn).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  return (
    <div
      className={`w-full rounded-[32px] border border-[#e8ded1] bg-[#fffdfa] p-4 shadow-[0_20px_60px_rgba(44,35,25,0.08)] sm:p-6 ${className}`}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9a846d]">
            Canlı müsaitlik
          </span>

          <h3 className="mt-1 text-[24px] font-black tracking-[-0.04em] text-[#1b1b1b]">
            {formatMonthLabel(visibleMonth)}
          </h3>

          <p className="mt-1 text-[13px] font-medium text-[#7a7068]">
            Günlerin altında gecelik fiyatlar gösterilir.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevMonth}
            aria-label="Önceki ay"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e4d8ca] bg-white text-[28px] font-semibold leading-none text-[#183f34] transition hover:bg-[#f3eee7]"
          >
            ‹
          </button>

          <button
            type="button"
            onClick={handleNextMonth}
            aria-label="Sonraki ay"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-[#e4d8ca] bg-white text-[28px] font-semibold leading-none text-[#183f34] transition hover:bg-[#f3eee7]"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-7 gap-2 text-center text-[12px] font-black uppercase tracking-[0.08em] text-[#8a7b6d]">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarCells.map((cell) => {
          const dateKey = formatDateKey(cell.date);
          const priceInfo = pricesByDate[dateKey];
          const selectedStart = isSameDay(cell.date, checkIn);
          const selectedEnd = isSameDay(cell.date, checkOut);
          const inRange = isInSelectedRange(cell.date);

          const unavailable =
            cell.inCurrentMonth &&
            !!priceInfo &&
            priceInfo.availableCount === 0;

          const hasPrice = !!priceInfo && priceInfo.lowestPrice !== null;

          if (!cell.inCurrentMonth) {
            return (
              <div
                key={dateKey}
                className="flex min-h-[78px] flex-col items-center justify-center rounded-[20px] bg-[#f4f0ea] text-[#c1b5a8]"
              >
                <span className="text-[17px] font-black leading-none">
                  {cell.date.getDate()}
                </span>
              </div>
            );
          }

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => handleDayClick(cell.date, unavailable)}
              disabled={unavailable}
              title={
                unavailable
                  ? "Bu gün dolu"
                  : hasPrice
                    ? `${formatPrice(priceInfo.lowestPrice)} gecelik başlangıç`
                    : "Fiyat bilgisi bekleniyor"
              }
              className={[
                "group relative flex min-h-[78px] flex-col items-center justify-center overflow-hidden rounded-[20px] border text-center transition duration-200",
                selectedStart || selectedEnd
                  ? "border-[#183f34] bg-[#183f34] text-white shadow-[0_14px_30px_rgba(24,63,52,0.24)]"
                  : inRange
                    ? "border-[#cfe1d9] bg-[#eef7f3] text-[#1b1b1b]"
                    : "border-[#eadfd3] bg-white text-[#1b1b1b] hover:-translate-y-0.5 hover:border-[#183f34]/30 hover:bg-[#fbf7f1]",
                unavailable ? "cursor-not-allowed opacity-55 grayscale" : ""
              ].join(" ")}
            >
              {!unavailable && hasPrice ? (
                <span
                  className={[
                    "absolute right-2 top-2 h-2 w-2 rounded-full",
                    selectedStart || selectedEnd ? "bg-white" : "bg-[#183f34]"
                  ].join(" ")}
                />
              ) : null}

              <span className="text-[18px] font-black leading-none">
                {cell.date.getDate()}
              </span>

              <span
                className={[
                  "mt-2 min-h-[16px] text-[10px] font-black leading-none",
                  selectedStart || selectedEnd
                    ? "text-white/90"
                    : unavailable
                      ? "text-[#b94a48]"
                      : hasPrice
                        ? "text-[#6f6257]"
                        : "text-[#b8aca0]"
                ].join(" ")}
              >
                {priceInfo ? formatPrice(priceInfo.lowestPrice) : "—"}
              </span>

              <span
                className={[
                  "mt-1 text-[9px] font-bold leading-none",
                  selectedStart || selectedEnd
                    ? "text-white/70"
                    : unavailable
                      ? "text-[#b94a48]"
                      : "text-[#9a8f84]"
                ].join(" ")}
              >
                {unavailable ? "Dolu" : hasPrice ? "Müsait" : ""}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-[24px] border border-[#eadfd3] bg-[#fbf8f3] p-4">
        {loadingMonth ? (
          <p className="text-[14px] font-semibold text-[#6f6257]">
            Fiyatlar güncelleniyor...
          </p>
        ) : checkIn && checkOut ? (
          <div className="space-y-1">
            <p className="text-[15px] font-black text-[#1b1b1b]">
              Giriş: {formatLongDate(checkIn)}
            </p>

            <p className="text-[15px] font-black text-[#1b1b1b]">
              Çıkış: {formatLongDate(checkOut)}
            </p>

            <p className="text-[14px] font-medium text-[#6f6257]">
              Toplam {nights} gece seçildi.
            </p>
          </div>
        ) : checkIn ? (
          <div className="space-y-1">
            <p className="text-[15px] font-black text-[#1b1b1b]">
              Giriş: {formatLongDate(checkIn)}
            </p>

            <p className="text-[14px] font-medium text-[#6f6257]">
              Şimdi çıkış tarihini seç.
            </p>
          </div>
        ) : (
          <p className="text-[14px] font-semibold text-[#6f6257]">
            Önce giriş tarihini seç.
          </p>
        )}
      </div>
    </div>
  );
}
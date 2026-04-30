"use client";

import { useEffect } from "react";

type KuleSearchPayload = {
  checkin: string;
  checkout: string;
  adults: string;
  children: string;
  breakfast: string;
  mode: string;
};

const STORAGE_KEY = "kule:lastSearch";

function normalizePayload(params: URLSearchParams): KuleSearchPayload {
  return {
    checkin:
      params.get("checkin") ||
      params.get("checkIn") ||
      params.get("startDate") ||
      params.get("start") ||
      "",
    checkout:
      params.get("checkout") ||
      params.get("checkOut") ||
      params.get("endDate") ||
      params.get("end") ||
      "",
    adults:
      params.get("adults") ||
      params.get("adult") ||
      params.get("guests") ||
      params.get("guestCount") ||
      "2",
    children:
      params.get("children") ||
      params.get("child") ||
      params.get("kids") ||
      "0",
    breakfast: params.get("breakfast") || "false",
    mode: params.get("mode") || "exact"
  };
}

function readSavedPayload(): Partial<KuleSearchPayload> {
  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePayload(payload: KuleSearchPayload) {
  if (!payload.checkin || !payload.checkout) return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function mergePayload(current: KuleSearchPayload): KuleSearchPayload {
  const saved = readSavedPayload();

  return {
    checkin: current.checkin || saved.checkin || "",
    checkout: current.checkout || saved.checkout || "",
    adults: current.adults || String(saved.adults || "2"),
    children: current.children || String(saved.children || "0"),
    breakfast: current.breakfast || String(saved.breakfast || "false"),
    mode: current.mode || String(saved.mode || "exact")
  };
}

export function KuleSearchHandoff() {
  useEffect(() => {
    const currentPayload = normalizePayload(new URLSearchParams(window.location.search));

    if (currentPayload.checkin && currentPayload.checkout) {
      savePayload(currentPayload);
    }

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a") as HTMLAnchorElement | null;

      if (!link) return;

      const url = new URL(link.href, window.location.origin);

      if (url.origin !== window.location.origin) return;
      if (!url.pathname.startsWith("/properties/")) return;

      const payload = mergePayload(normalizePayload(new URLSearchParams(window.location.search)));

      if (!payload.checkin || !payload.checkout) return;

      url.searchParams.set("mode", payload.mode || "exact");
      url.searchParams.set("checkin", payload.checkin);
      url.searchParams.set("checkout", payload.checkout);
      url.searchParams.set("adults", payload.adults || "2");
      url.searchParams.set("children", payload.children || "0");
      url.searchParams.set("breakfast", payload.breakfast || "false");
      url.searchParams.set("fromResults", "1");

      savePayload(payload);

      event.preventDefault();
      window.location.href = url.toString();
    }

    document.addEventListener("click", handleClick, true);

    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, []);

  return null;
}
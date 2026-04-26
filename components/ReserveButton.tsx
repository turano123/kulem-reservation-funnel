"use client";

import { useState } from "react";
import type { QuotePayload } from "@/lib/types";

type ReserveButtonProps = {
  payload: QuotePayload;
  disabled?: boolean;
  className?: string;
};

export function ReserveButton({
  payload,
  disabled = false,
  className = ""
}: ReserveButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (disabled || loading) return;

    try {
      setLoading(true);

      const response = await fetch("/api/quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = (await response.json()) as {
        whatsappUrl?: string;
        error?: string;
      };

      if (!response.ok || !data.whatsappUrl) {
        window.alert(
          data.error ??
            "Rezervasyon talebi hazırlanamadı. Lütfen tekrar deneyiniz."
        );
        return;
      }

      window.location.assign(data.whatsappUrl);
    } catch {
      window.alert(
        "Rezervasyon talebi hazırlanırken bir sorun oluştu. Lütfen tekrar deneyiniz."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className={`button-secondary reserve-button ${className}`}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      <span>{loading ? "WhatsApp hazırlanıyor..." : "Rezervasyon Oluştur"}</span>
    </button>
  );
}
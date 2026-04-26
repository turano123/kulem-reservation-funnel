import type { QuotePayload } from "./types";
import { formatCurrency, formatDateCompact } from "./format";

export function buildReservationMessage(quoteId: string, payload: QuotePayload) {
  const lines = [
    "Merhaba,",
    payload.checkin && payload.checkout
      ? `${formatDateCompact(payload.checkin)} giriş ${formatDateCompact(payload.checkout)} çıkış`
      : "tarihimi henüz netleştirmedim",
    `${payload.adults} yetişkin${payload.children ? `, ${payload.children} çocuk` : ""}`,
    `${payload.propertyName} seçtim.`,
    payload.shownPrice ? `Gösterilen fiyat: ${formatCurrency(payload.shownPrice)}` : "Fiyat bilgisini sistemde gördüm.",
    `Rezervasyon oluşturmak istiyorum. Teklif no: ${quoteId}`
  ];
  return lines.join(" ");
}

export function buildInfoMessage(propertyName: string, context?: string) {
  return `Merhaba, ${propertyName} hakkında bilgi almak istiyorum.${context ? ` ${context}` : ""}`;
}

export function buildWhatsAppUrl(message: string) {
  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "905000000000";
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

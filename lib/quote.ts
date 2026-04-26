import type { QuotePayload } from "./types";

export function createQuoteId() {
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `KS-${Date.now().toString().slice(-4)}${random}`;
}

export function createQuote(payload: QuotePayload) {
  return {
    quoteId: createQuoteId(),
    payload,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
  };
}

import { NextResponse } from "next/server";
import type { QuotePayload } from "@/lib/types";
import { createQuote } from "@/lib/quote";
import { buildReservationMessage, buildWhatsAppUrl } from "@/lib/whatsapp";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as QuotePayload;
    if (!payload.propertySlug || !payload.propertyName) {
      return NextResponse.json({ error: "Eksik ev bilgisi." }, { status: 400 });
    }
    if (payload.mode === "exact" && (!payload.checkin || !payload.checkout)) {
      return NextResponse.json({ error: "Kesin tarihli rezervasyon için tarih zorunlu." }, { status: 400 });
    }
    const quote = createQuote(payload);
    const message = buildReservationMessage(quote.quoteId, payload);
    const whatsappUrl = buildWhatsAppUrl(message);
    return NextResponse.json({
      ok: true,
      quoteId: quote.quoteId,
      createdAt: quote.createdAt,
      expiresAt: quote.expiresAt,
      whatsappUrl
    });
  } catch {
    return NextResponse.json({ error: "Quote oluşturulurken hata oluştu." }, { status: 500 });
  }
}

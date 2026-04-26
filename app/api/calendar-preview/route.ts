import { NextRequest, NextResponse } from "next/server";
import {
  getLowestPriceForDate,
  getLowestPricesForMonth
} from "../../../lib/get-lowest-prices-for-month";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const month = req.nextUrl.searchParams.get("month");
    const date = req.nextUrl.searchParams.get("date");

    if (month) {
      const data = await getLowestPricesForMonth(month);

      return NextResponse.json({
        ok: true,
        mode: "month",
        ...data
      });
    }

    if (date) {
      const data = await getLowestPriceForDate(date);

      return NextResponse.json({
        ok: true,
        mode: "date",
        ...data
      });
    }

    return NextResponse.json(
      {
        ok: false,
        message: "month veya date parametresi göndermelisin."
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Bilinmeyen hata"
      },
      { status: 500 }
    );
  }
}
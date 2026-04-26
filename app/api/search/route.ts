import { NextResponse } from "next/server";
import { parseSearchParams } from "@/lib/parse-search";
import { searchProperties } from "@/lib/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const resolved: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    resolved[key] = value;
  });
  const payload = parseSearchParams(resolved);
  const results = await searchProperties(payload);
  return NextResponse.json({ ok: true, payload, results });
}

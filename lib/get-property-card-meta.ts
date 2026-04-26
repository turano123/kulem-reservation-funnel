import { getGoogleSheetsClient } from "./google-auth";
import path from "path";
import { google, sheets_v4 } from "googleapis";

type PropertySheetConfig = {
  slug: string;
  name: string;
  sheetTitle: string;
};

export type PropertyCardMeta = {
  propertySlug: string;
  propertyName: string;
  source: "google-sheet";
  firstAvailableDate: string | null;
  firstAvailablePrice: number | null;
  currentYearBestPrice: number | null;
  currentYearBestPriceDate: string | null;
  availableFutureDates: number;
};

export type PropertyCardMetaMap = Record<string, PropertyCardMeta>;

type CachedMetaMap = {
  expiresAt: number;
  data: PropertyCardMetaMap;
};

const PROPERTY_SHEETS: PropertySheetConfig[] = [
  {
    slug: "kule-yesil-ev",
    name: "Kule YeÅŸil Ev",
    sheetTitle: "KulemYESİLEV"
  },
  {
    slug: "kule-suit",
    name: "Kule Suit",
    sheetTitle: "KulemSUIT"
  },
  {
    slug: "kule-deluxe",
    name: "Kule Deluxe",
    sheetTitle: "KulemDeluxe"
  }
];

const PROPERTY_BY_SLUG = new Map(
  PROPERTY_SHEETS.map((property) => [property.slug, property] as const)
);

const SHEET_RANGE = process.env.GOOGLE_RANGE ?? "A3:J";

const COLUMN_INDEX = {
  date: Number(process.env.SHEETS_DATE_INDEX ?? 0),
  status: Number(process.env.SHEETS_STATUS_INDEX ?? 8),
  price: Number(process.env.SHEETS_PRICE_INDEX ?? 9)
};

const CACHE_TTL_MS = Number(process.env.SHEETS_CACHE_TTL_MS ?? 5 * 60_000);
const STALE_CACHE_TTL_MS = Number(
  process.env.SHEETS_STALE_CACHE_TTL_MS ?? 30 * 60_000
);

let cachedMetaMap: CachedMetaMap | null = null;
let staleMetaMap: CachedMetaMap | null = null;
let pendingMetaRead: Promise<PropertyCardMetaMap> | null = null;
let sheetsClientPromise: Promise<sheets_v4.Sheets> | null = null;

function resolveGoogleCredentialsPath() {
  const rawPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!rawPath) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS tanÄ±mlÄ± deÄŸil.");
  }

  return path.isAbsolute(rawPath) ? rawPath : path.join(process.cwd(), rawPath);
}

function getSpreadsheetId() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEET_ID tanÄ±mlÄ± deÄŸil.");
  }

  return spreadsheetId;
}

function getPropertyConfig(propertySlug: string) {
  const property = PROPERTY_BY_SLUG.get(propertySlug);

  if (!property) {
    throw new Error(`Bilinmeyen property slug: ${propertySlug}`);
  }

  return property;
}

function createEmptyMeta(property: PropertySheetConfig): PropertyCardMeta {
  return {
    propertySlug: property.slug,
    propertyName: property.name,
    source: "google-sheet",
    firstAvailableDate: null,
    firstAvailablePrice: null,
    currentYearBestPrice: null,
    currentYearBestPriceDate: null,
    availableFutureDates: 0
  };
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u0131/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseSheetDate(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === "") return null;

  if (typeof raw === "number" && Number.isFinite(raw)) {
    const epoch = Date.UTC(1899, 11, 30);
    const date = new Date(epoch + Math.round(raw * 86400000));
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }

  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10);
  }

  const value = String(raw).trim();
  if (!value) return null;

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const trMatch = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (trMatch) {
    const day = trMatch[1].padStart(2, "0");
    const month = trMatch[2].padStart(2, "0");
    const year = trMatch[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}
function parsePrice(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;

  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw > 0 ? raw : null;
  }

  const cleaned = String(raw)
    .trim()
    .replace(/[^\d.,-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");

  const value = Number(cleaned);

  return Number.isFinite(value) && value > 0 ? value : null;
}

function isAvailableStatus(raw: unknown) {
  const value = normalizeText(raw);

  return [
    "bos",
    "bos-musait",
    "musait",
    "available",
    "uygun",
    "true",
    "evet",
    "1"
  ].includes(value);
}

function escapeSheetTitle(sheetTitle: string) {
  return `'${sheetTitle.replace(/'/g, "''")}'`;
}

function formatIsoLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function createSheetsClient(): Promise<sheets_v4.Sheets> {
return getGoogleSheetsClient();
}

async function getSheetsClient(): Promise<sheets_v4.Sheets> {
  sheetsClientPromise ??= createSheetsClient();
  return sheetsClientPromise;
}

async function fetchAllPropertyRows() {
  const sheets = await getSheetsClient();
  const spreadsheetId = getSpreadsheetId();

  const ranges = PROPERTY_SHEETS.map(
    (property) => `${escapeSheetTitle(property.sheetTitle)}!${SHEET_RANGE}`
  );

  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
    valueRenderOption: "FORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING"
  });

  const rowsBySlug: Record<string, unknown[][]> = {};

  PROPERTY_SHEETS.forEach((property, index) => {
    const rows = (response.data.valueRanges?.[index]?.values ?? []) as unknown[][];
    rowsBySlug[property.slug] = rows;
  });

  return rowsBySlug;
}

function buildMetaFromRows(
  property: PropertySheetConfig,
  rows: unknown[][],
  todayIso: string,
  currentYear: number
): PropertyCardMeta {
  let firstAvailableDate: string | null = null;
  let firstAvailablePrice: number | null = null;

  let currentYearBestPrice: number | null = null;
  let currentYearBestPriceDate: string | null = null;

  let availableFutureDates = 0;

  for (const row of rows) {
    const rowDate = parseSheetDate(row[COLUMN_INDEX.date]);
    if (!rowDate) continue;

    const rowYear = Number(rowDate.slice(0, 4));
    if (rowYear !== currentYear) continue;
    if (rowDate < todayIso) continue;

    const rowStatus = row[COLUMN_INDEX.status];
    if (!isAvailableStatus(rowStatus)) continue;

    const rowPrice = parsePrice(row[COLUMN_INDEX.price]);
    if (rowPrice === null || rowPrice <= 0) continue;

    availableFutureDates += 1;

    if (!firstAvailableDate || rowDate < firstAvailableDate) {
      firstAvailableDate = rowDate;
      firstAvailablePrice = rowPrice;
    }

    if (currentYearBestPrice === null || rowPrice < currentYearBestPrice) {
      currentYearBestPrice = rowPrice;
      currentYearBestPriceDate = rowDate;
    }
  }

  return {
    propertySlug: property.slug,
    propertyName: property.name,
    source: "google-sheet",
    firstAvailableDate,
    firstAvailablePrice,
    currentYearBestPrice,
    currentYearBestPriceDate,
    availableFutureDates
  };
}

async function buildPropertyCardMetaMap(): Promise<PropertyCardMetaMap> {
  const rowsBySlug = await fetchAllPropertyRows();
  const today = new Date();
  const todayIso = formatIsoLocal(today);
  const currentYear = today.getFullYear();

  const entries = PROPERTY_SHEETS.map((property) => {
    const rows = rowsBySlug[property.slug] ?? [];
    return [
      property.slug,
      buildMetaFromRows(property, rows, todayIso, currentYear)
    ] as const;
  });

  return Object.fromEntries(entries) as PropertyCardMetaMap;
}

async function getAllPropertyCardMeta(): Promise<PropertyCardMetaMap> {
  const now = Date.now();

  if (cachedMetaMap && cachedMetaMap.expiresAt > now) {
    return cachedMetaMap.data;
  }

  if (pendingMetaRead) {
    return pendingMetaRead;
  }

  pendingMetaRead = buildPropertyCardMetaMap()
    .then((data) => {
      cachedMetaMap = {
        data,
        expiresAt: Date.now() + CACHE_TTL_MS
      };

      staleMetaMap = {
        data,
        expiresAt: Date.now() + STALE_CACHE_TTL_MS
      };

      return data;
    })
    .catch((error) => {
      console.error("[getPropertyCardMeta] Google Sheet batch okuma hatasÄ±:", error);

      if (staleMetaMap && staleMetaMap.expiresAt > Date.now()) {
        return staleMetaMap.data;
      }

      return Object.fromEntries(
        PROPERTY_SHEETS.map((property) => [property.slug, createEmptyMeta(property)])
      ) as PropertyCardMetaMap;
    })
    .finally(() => {
      pendingMetaRead = null;
    });

  return pendingMetaRead;
}

export async function getPropertyCardMeta(
  propertySlug: string
): Promise<PropertyCardMeta> {
  const property = getPropertyConfig(propertySlug);
  const metaMap = await getAllPropertyCardMeta();
  return metaMap[property.slug] ?? createEmptyMeta(property);
}

export async function getPropertyCardMetaMap(propertySlugs: string[]) {
  const uniqueSlugs = [...new Set(propertySlugs)];

  uniqueSlugs.forEach((slug) => {
    getPropertyConfig(slug);
  });

  const metaMap = await getAllPropertyCardMeta();

  return Object.fromEntries(
    uniqueSlugs.map((slug) => [slug, metaMap[slug]])
  ) as Record<string, PropertyCardMeta>;
}

export function clearPropertyCardMetaCache() {
  cachedMetaMap = null;
  pendingMetaRead = null;
}







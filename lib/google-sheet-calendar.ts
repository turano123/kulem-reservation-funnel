import { getGoogleSheetsClient } from "./google-auth";
import path from "path";
import { google } from "googleapis";

type PropertySheetConfig = {
  slug: string;
  name: string;
  sheetAliases: string[];
};

type AvailableProperty = {
  slug: string;
  name: string;
  price: number;
  sheetTitle: string;
};

const PROPERTY_SHEETS: PropertySheetConfig[] = [
  {
    slug: "kule-yesil-ev",
    name: "Kule YeÅŸil Ev",
    sheetAliases: ["KulemYESİLEV", "kule yeÅŸil ev", "YEÅÄ°L EV"]
  },
  {
    slug: "kule-suit",
    name: "Kule Suit",
    sheetAliases: ["KulemSUIT", "KULE SUÄ°T", "KULE SUIT"]
  },
  {
    slug: "kule-deluxe",
    name: "Kule Deluxe",
    sheetAliases: ["KulemDeluxe", "KULE DELUXE"]
  }
];

const SHEET_RANGE = process.env.GOOGLE_RANGE ?? "A3:J";

const COLUMN_INDEX = {
  date: Number(process.env.SHEETS_DATE_INDEX ?? 0),   // A
  status: Number(process.env.SHEETS_STATUS_INDEX ?? 8), // I
  price: Number(process.env.SHEETS_PRICE_INDEX ?? 9)    // J
};

function getSpreadsheetId() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEET_ID tanÄ±mlÄ± deÄŸil.");
  }

  return spreadsheetId;
}

function resolveGoogleCredentialsPath() {
  const rawPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!rawPath) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS tanÄ±mlÄ± deÄŸil.");
  }

  return path.isAbsolute(rawPath) ? rawPath : path.join(process.cwd(), rawPath);
}

function normalizeText(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replaceAll("Ä±", "i")
    .replaceAll("ÅŸ", "s")
    .replaceAll("ÄŸ", "g")
    .replaceAll("Ã¼", "u")
    .replaceAll("Ã¶", "o")
    .replaceAll("Ã§", "c");
}

function escapeSheetTitle(sheetTitle: string) {
  return `'${sheetTitle.replace(/'/g, "''")}'`;
}

function parseSheetDate(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === "") return null;

  const value = String(raw).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{2}\.\d{2}\.\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split(".");
    return `${yyyy}-${mm}-${dd}`;
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [dd, mm, yyyy] = value.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
}

function parsePrice(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;

  if (typeof raw === "number" && Number.isFinite(raw)) {
    return raw;
  }

  const cleaned = String(raw)
    .trim()
    .replace(/[^\d.,-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const value = Number(cleaned);

  if (!Number.isFinite(value)) return null;
  return value;
}

function isAvailableStatus(raw: unknown) {
  const value = normalizeText(raw);

  return [
    "bos",
    "musait",
    "mÃ¼sait",
    "available",
    "uygun",
    "true",
    "evet",
    "1"
  ].includes(value);
}

async function getSheetsClient() {
return getGoogleSheetsClient();
}

async function listSheetTitles(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string
) {
  const response = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties.title"
  });

  return (
    response.data.sheets
      ?.map((sheet) => sheet.properties?.title)
      .filter((title): title is string => Boolean(title)) ?? []
  );
}

function resolveActualSheetTitle(
  property: PropertySheetConfig,
  existingTitles: string[]
) {
  const normalizedTitleMap = new Map(
    existingTitles.map((title) => [normalizeText(title), title])
  );

  for (const alias of property.sheetAliases) {
    const match = normalizedTitleMap.get(normalizeText(alias));
    if (match) return match;
  }

  throw new Error(
    `${property.name} iÃ§in sheet bulunamadÄ±. Beklenen tablar: ${property.sheetAliases.join(", ")}`
  );
}

async function getSheetRows(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  sheetTitle: string
) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${escapeSheetTitle(sheetTitle)}!${SHEET_RANGE}`,
    valueRenderOption: "FORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING"
  });

  return response.data.values ?? [];
}

async function getAvailablePriceForPropertyOnDate(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  existingTitles: string[],
  property: PropertySheetConfig,
  date: string
): Promise<AvailableProperty | null> {
  const actualSheetTitle = resolveActualSheetTitle(property, existingTitles);
  const rows = await getSheetRows(sheets, spreadsheetId, actualSheetTitle);

  let bestPrice: number | null = null;

  for (const row of rows) {
    const rowDate = parseSheetDate(row[COLUMN_INDEX.date]);
    if (rowDate !== date) continue;

    const rowStatus = row[COLUMN_INDEX.status];
    if (!isAvailableStatus(rowStatus)) continue;

    const rowPrice = row[COLUMN_INDEX.price];
    const price = parsePrice(rowPrice);
    if (price === null) continue;

    if (bestPrice === null || price < bestPrice) {
      bestPrice = price;
    }
  }

  if (bestPrice === null) return null;

  return {
    slug: property.slug,
    name: property.name,
    price: bestPrice,
    sheetTitle: actualSheetTitle
  };
}

export async function getLowestPriceForDate(date: string) {
  const spreadsheetId = getSpreadsheetId();
  const sheets = await getSheetsClient();
  const existingTitles = await listSheetTitles(sheets, spreadsheetId);

  const availableProperties = (
    await Promise.all(
      PROPERTY_SHEETS.map((property) =>
        getAvailablePriceForPropertyOnDate(
          sheets,
          spreadsheetId,
          existingTitles,
          property,
          date
        )
      )
    )
  )
    .filter((item): item is AvailableProperty => item !== null)
    .sort((a, b) => a.price - b.price);

  const lowestPrice = availableProperties.length
    ? availableProperties[0].price
    : null;

  return {
    date,
    currency: "TRY",
    lowestPrice,
    availableProperties,
    message: lowestPrice === null
      ? "SeÃ§ilen gÃ¼n iÃ§in mÃ¼sait ev bulunamadÄ±."
      : undefined
  };
}




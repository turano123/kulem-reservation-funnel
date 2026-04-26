function escapeSheetTitle(sheetTitle: string) {
  return `'${String(sheetTitle).replace(/'/g, "''")}'`;
}
import { getGoogleSheetsClient } from "./google-auth";
import path from "path";
import { google, sheets_v4 } from "googleapis";

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

export type DailyLowestPrice = {
  date: string;
  lowestPrice: number | null;
  availableCount: number;
  availableProperties: AvailableProperty[];
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
  date: Number(process.env.SHEETS_DATE_INDEX ?? 0),
  status: Number(process.env.SHEETS_STATUS_INDEX ?? 8),
  price: Number(process.env.SHEETS_PRICE_INDEX ?? 9)
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
    "musait",
    "mÃ¼sait",
    "available",
    "uygun",
    "true",
    "evet",
    "1"
  ].includes(value);
}

async function getSheetsClient(): Promise<sheets_v4.Sheets> {
return getGoogleSheetsClient();
}

async function listSheetTitles(
  sheets: sheets_v4.Sheets,
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
  sheets: sheets_v4.Sheets,
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

function getMonthDates(month: string) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthIndex = Number(monthText) - 1;

  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    throw new Error("month parametresi YYYY-MM formatÄ±nda olmalÄ±.");
  }

  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const dates: string[] = [];

  for (let day = 1; day <= lastDay; day += 1) {
    const dayText = String(day).padStart(2, "0");
    dates.push(`${yearText}-${monthText}-${dayText}`);
  }

  return dates;
}

export async function getLowestPricesForMonth(month: string) {
  const spreadsheetId = getSpreadsheetId();
  const sheets = await getSheetsClient();
  const existingTitles = await listSheetTitles(sheets, spreadsheetId);
  const monthDates = getMonthDates(month);
  const monthDateSet = new Set(monthDates);

  const resultMap = new Map<string, DailyLowestPrice>();

  for (const date of monthDates) {
    resultMap.set(date, {
      date,
      lowestPrice: null,
      availableCount: 0,
      availableProperties: []
    });
  }

  for (const property of PROPERTY_SHEETS) {
    const actualSheetTitle = resolveActualSheetTitle(property, existingTitles);
    const rows = await getSheetRows(sheets, spreadsheetId, actualSheetTitle);

    for (const row of rows) {
      const rowDate = parseSheetDate(row[COLUMN_INDEX.date]);

      if (!rowDate || !monthDateSet.has(rowDate)) continue;

      const rowStatus = row[COLUMN_INDEX.status];
      if (!isAvailableStatus(rowStatus)) continue;

      const rowPrice = row[COLUMN_INDEX.price];
      const price = parsePrice(rowPrice);
      if (price === null) continue;

      const currentDay = resultMap.get(rowDate);
      if (!currentDay) continue;

      currentDay.availableProperties.push({
        slug: property.slug,
        name: property.name,
        price,
        sheetTitle: actualSheetTitle
      });
    }
  }

  for (const currentDay of resultMap.values()) {
    currentDay.availableProperties.sort((a, b) => a.price - b.price);
    currentDay.availableCount = currentDay.availableProperties.length;
    currentDay.lowestPrice =
      currentDay.availableProperties.length > 0
        ? currentDay.availableProperties[0].price
        : null;
  }

  return {
    month,
    currency: "TRY",
    days: Array.from(resultMap.values()).sort((a, b) => a.date.localeCompare(b.date))
  };
}

export async function getLowestPriceForDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("date parametresi YYYY-MM-DD formatÄ±nda olmalÄ±.");
  }

  const month = date.slice(0, 7);
  const monthData = await getLowestPricesForMonth(month);
  const dayData = monthData.days.find((item) => item.date === date);

  return {
    date,
    currency: "TRY",
    lowestPrice: dayData?.lowestPrice ?? null,
    availableCount: dayData?.availableCount ?? 0,
    availableProperties: dayData?.availableProperties ?? [],
    message:
      dayData?.lowestPrice === null
        ? "SeÃ§ilen gÃ¼n iÃ§in mÃ¼sait ev bulunamadÄ±."
        : undefined
  };
}







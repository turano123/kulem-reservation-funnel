import { getGoogleSheetsClient } from "../google-auth";
import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";
import { properties } from "../mock-data";
import type { Property } from "../types";

type SheetDay = {
  date: string;
  status: string;
  price: number;
};

type PropertyWithSheetRows = Property & {
  sheetRows: SheetDay[];
};

type CachedProperties = {
  expiresAt: number;
  data: Property[];
};

type DiskCachePayload = {
  savedAt: number;
  data: Property[];
};

type KuleSheetsGlobalCache = {
  cachedProperties: CachedProperties | null;
  staleProperties: CachedProperties | null;
  pendingRead: Promise<Property[]> | null;
  sheetsClientPromise: ReturnType<typeof createSheetsClient> | null;
  lastFailedAt: number;
};

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const GOOGLE_RANGE = process.env.GOOGLE_RANGE ?? "A3:J";

const DATE_INDEX = Number(process.env.SHEETS_DATE_INDEX ?? 0);
const STATUS_INDEX = Number(process.env.SHEETS_STATUS_INDEX ?? 8);
const PRICE_INDEX = Number(process.env.SHEETS_PRICE_INDEX ?? 9);

/**
 * Google Sheets kotasÄ±nÄ± korumak iÃ§in cache sÃ¼relerini uzun tutuyoruz.
 * Dev ortamÄ±nda hot reload sÄ±k Ã§alÄ±ÅŸtÄ±ÄŸÄ± iÃ§in memory cache tek baÅŸÄ±na yetmeyebilir.
 */
const CACHE_TTL_MS = Number(process.env.SHEETS_CACHE_TTL_MS ?? 15 * 60_000);
const STALE_CACHE_TTL_MS = Number(process.env.SHEETS_STALE_CACHE_TTL_MS ?? 6 * 60 * 60_000);
const FAILED_READ_COOLDOWN_MS = Number(process.env.SHEETS_FAILED_READ_COOLDOWN_MS ?? 60_000);

const DISK_CACHE_PATH =
  process.env.SHEETS_DISK_CACHE_PATH ??
  path.join(process.cwd(), ".next", "cache", "kule-google-sheets-properties.json");

const PROPERTY_SHEET_MAP: Record<string, string> = {
  "kule-yesil-ev": "KulemYESİLEV",
  "kule-suit": "KulemSUIT",
  "kule-deluxe": "KulemDeluxe"
};

const globalStore = globalThis as typeof globalThis & {
  __kuleSheetsGlobalCache?: KuleSheetsGlobalCache;
};

const store: KuleSheetsGlobalCache =
  globalStore.__kuleSheetsGlobalCache ?? {
    cachedProperties: null,
    staleProperties: null,
    pendingRead: null,
    sheetsClientPromise: null,
    lastFailedAt: 0
  };

globalStore.__kuleSheetsGlobalCache = store;

function resolveCredentialsPath() {
  const rawPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!rawPath) return null;

  return path.isAbsolute(rawPath) ? rawPath : path.join(process.cwd(), rawPath);
}

function formatIsoLocal(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseGoogleSerialDate(value: number) {
  /**
   * Google Sheets / Excel serial date epoch: 1899-12-30.
   * Saat farkÄ± kaymasÄ± olmamasÄ± iÃ§in UTC kullanÄ±p local ISO'a Ã§evirmiyoruz,
   * doÄŸrudan UTC parÃ§alarÄ±ndan yyyy-mm-dd Ã¼retiyoruz.
   */
  const epoch = Date.UTC(1899, 11, 30);
  const date = new Date(epoch + value * 86_400_000);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeDate(value: unknown) {
  if (value === null || value === undefined || value === "") return "";

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatIsoLocal(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return parseGoogleSerialDate(value);
  }

  const raw = String(value).trim();
  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const dotOrSlashMatch = raw.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dotOrSlashMatch) {
    const [, dd, mm, yyyy] = dotOrSlashMatch;
    return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";

  return formatIsoLocal(parsed);
}

function parsePrice(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 0 ? value : 0;
  }

  const raw = String(value ?? "").trim();
  if (!raw) return 0;

  const compact = raw.replace(/\s/g, "").replace(/[â‚ºâ‚¼â‚¬$]/g, "");
  let normalized = compact;

  if (compact.includes(",") && compact.includes(".")) {
    const lastComma = compact.lastIndexOf(",");
    const lastDot = compact.lastIndexOf(".");

    normalized =
      lastComma > lastDot
        ? compact.replace(/\./g, "").replace(",", ".")
        : compact.replace(/,/g, "");
  } else if (compact.includes(",")) {
    normalized = compact.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = compact.replace(/,/g, "");

    /**
     * 9.000 gibi TÃ¼rkÃ§e binlik ayracÄ± iÃ§in nokta tamamen kaldÄ±rÄ±lÄ±r.
     * 9000.50 gibi ondalÄ±klÄ± veri kullanÄ±yorsanÄ±z Google Sheet'i sayÄ± formatÄ±nda tutmanÄ±z daha saÄŸlÄ±klÄ±.
     */
    if (/^\d{1,3}(\.\d{3})+$/.test(normalized)) {
      normalized = normalized.replace(/\./g, "");
    }
  }

  normalized = normalized.replace(/[^\d.-]/g, "");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function normalizeStatus(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLocaleUpperCase("tr-TR")
    .replaceAll("Ä°", "I")
    .replaceAll("IÌ‡", "I")
    .replaceAll("Å", "S")
    .replaceAll("Ä", "G")
    .replaceAll("Ãœ", "U")
    .replaceAll("Ã–", "O")
    .replaceAll("Ã‡", "C");
}

function isKnownStatus(status: string) {
  return ["BOS", "DOLU", "PENDING", "BEKLEMEDE"].includes(status);
}

function parseRows(rows: unknown[][]): SheetDay[] {
  return rows
    .map((row) => {
      const date = normalizeDate(row[DATE_INDEX]);
      const status = normalizeStatus(row[STATUS_INDEX]);
      const price = parsePrice(row[PRICE_INDEX]);

      return { date, status, price };
    })
    .filter((row) => {
      return /^\d{4}-\d{2}-\d{2}$/.test(row.date) && isKnownStatus(row.status);
    });
}

function escapeSheetName(sheetName: string) {
  return `'${sheetName.replace(/'/g, "''")}'`;
}

function getDiskCacheMaxAgeMs() {
  return Number(process.env.SHEETS_DISK_CACHE_MAX_AGE_MS ?? 24 * 60 * 60_000);
}

function readDiskCache(): Property[] | null {
  try {
    if (!fs.existsSync(DISK_CACHE_PATH)) return null;

    const raw = fs.readFileSync(DISK_CACHE_PATH, "utf8");
    const payload = JSON.parse(raw) as DiskCachePayload;

    if (!payload?.data || !Array.isArray(payload.data)) return null;

    const maxAge = getDiskCacheMaxAgeMs();
    if (Date.now() - Number(payload.savedAt ?? 0) > maxAge) return null;

    return payload.data;
  } catch {
    return null;
  }
}

function writeDiskCache(data: Property[]) {
  try {
    fs.mkdirSync(path.dirname(DISK_CACHE_PATH), { recursive: true });
    fs.writeFileSync(
      DISK_CACHE_PATH,
      JSON.stringify(
        {
          savedAt: Date.now(),
          data
        } satisfies DiskCachePayload,
        null,
        2
      ),
      "utf8"
    );
  } catch {
    /**
     * Disk cache yazÄ±lamazsa uygulama Ã§alÄ±ÅŸmaya devam etmeli.
     * Ã–zellikle bazÄ± deployment ortamlarÄ±nda filesystem read-only olabilir.
     */
  }
}

function hydrateMemoryCacheFromDisk(now: number) {
  const diskData = readDiskCache();
  if (!diskData) return false;

  store.cachedProperties = {
    data: diskData,
    expiresAt: now + CACHE_TTL_MS
  };

  store.staleProperties = {
    data: diskData,
    expiresAt: now + STALE_CACHE_TTL_MS
  };

  return true;
}

function getFallbackProperties(now: number) {
  if (store.staleProperties && store.staleProperties.expiresAt > now) {
    return store.staleProperties.data;
  }

  if (hydrateMemoryCacheFromDisk(now) && store.staleProperties) {
    return store.staleProperties.data;
  }

  return properties;
}

function isQuotaError(error: unknown) {
  const message = String(
    error instanceof Error ? error.message : (error as { message?: unknown })?.message ?? error
  ).toLowerCase();

  return (
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("read requests") ||
    message.includes("429")
  );
}

async function createSheetsClient() {
  const credentialsPath = resolveCredentialsPath();

  if (!SHEET_ID) {
    console.warn("[googleSheets] GOOGLE_SHEET_ID eksik. Mock property verisi kullanÄ±lacak.");
    return null;
  }

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() && (!credentialsPath || !fs.existsSync(credentialsPath))) {
    console.warn("[googleSheets] GOOGLE_APPLICATION_CREDENTIALS bulunamadÄ±. Mock property verisi kullanÄ±lacak:", credentialsPath);
    return null;
  }
return getGoogleSheetsClient();
}

async function getSheetsClient() {
  store.sheetsClientPromise ??= createSheetsClient();
  return store.sheetsClientPromise;
}

async function fetchAllSheetRows() {
  const sheets = await getSheetsClient();

  if (!sheets || !SHEET_ID) {
    return new Map<string, SheetDay[]>();
  }

  const entries = Object.entries(PROPERTY_SHEET_MAP);

  const ranges = entries.map(([, sheetName]) => `${escapeSheetName(sheetName)}!${GOOGLE_RANGE}`);

  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: SHEET_ID,
    ranges,
    valueRenderOption: "FORMATTED_VALUE",
    dateTimeRenderOption: "FORMATTED_STRING"
  });

  const result = new Map<string, SheetDay[]>();

  response.data.valueRanges?.forEach((valueRange, index) => {
    const [, sheetName] = entries[index];
    const rows = (valueRange.values ?? []) as unknown[][];
    result.set(sheetName, parseRows(rows));
  });

  return result;
}

async function buildPropertiesFromSheet(): Promise<Property[]> {
  const sheetRowsByName = await fetchAllSheetRows();

  return properties.map((property) => {
    const sheetName = PROPERTY_SHEET_MAP[property.slug];

    if (!sheetName) return property;

    return {
      ...property,
      sheetRows: sheetRowsByName.get(sheetName) ?? []
    } as PropertyWithSheetRows;
  });
}

export async function getPropertiesFromSheet(): Promise<Property[]> {
  const now = Date.now();

  if (store.cachedProperties && store.cachedProperties.expiresAt > now) {
    return store.cachedProperties.data;
  }

  if (hydrateMemoryCacheFromDisk(now) && store.cachedProperties?.expiresAt && store.cachedProperties.expiresAt > now) {
    return store.cachedProperties.data;
  }

  if (store.pendingRead) {
    return store.pendingRead;
  }

  /**
   * Son baÅŸarÄ±sÄ±z okuma Ã§ok yeniyse Google API'ye tekrar yÃ¼k bindirme.
   * Bu Ã¶zellikle Next dev server hot reload sÄ±rasÄ±nda kotayÄ± korur.
   */
  if (store.lastFailedAt && now - store.lastFailedAt < FAILED_READ_COOLDOWN_MS) {
    return getFallbackProperties(now);
  }

  store.pendingRead = buildPropertiesFromSheet()
    .then((data) => {
      store.cachedProperties = {
        data,
        expiresAt: Date.now() + CACHE_TTL_MS
      };

      store.staleProperties = {
        data,
        expiresAt: Date.now() + STALE_CACHE_TTL_MS
      };

      store.lastFailedAt = 0;
      writeDiskCache(data);

      return data;
    })
    .catch((error) => {
      store.lastFailedAt = Date.now();

      if (isQuotaError(error)) {
        console.warn("[googleSheets] Google Sheets kota limiti aÅŸÄ±ldÄ±. Cache/stale veri kullanÄ±lacak.");
      } else {
        console.warn("[googleSheets] Sheet batch okuma hatasÄ±. Cache/stale veri kullanÄ±lacak:", error);
      }

      return getFallbackProperties(Date.now());
    })
    .finally(() => {
      store.pendingRead = null;
    });

  return store.pendingRead;
}

export function clearGoogleSheetsCache() {
  store.cachedProperties = null;
  store.staleProperties = null;
  store.pendingRead = null;
  store.lastFailedAt = 0;

  try {
    if (fs.existsSync(DISK_CACHE_PATH)) {
      fs.unlinkSync(DISK_CACHE_PATH);
    }
  } catch {
    // Cache temizleme baÅŸarÄ±sÄ±z olsa bile uygulamayÄ± durdurma.
  }
}





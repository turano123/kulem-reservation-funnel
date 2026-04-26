import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

const GOOGLE_SHEETS_SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets.readonly",
];

export function getGoogleSheetsAuth() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();

  if (serviceAccountJson) {
    const credentials = JSON.parse(serviceAccountJson);

    if (credentials.private_key) {
      credentials.private_key = credentials.private_key.replace(/\\n/g, "\n");
    }

    return new google.auth.GoogleAuth({
      credentials,
      scopes: GOOGLE_SHEETS_SCOPES,
    });
  }

  const rawPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!rawPath) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON veya GOOGLE_APPLICATION_CREDENTIALS tanımlı değil."
    );
  }

  const credentialsPath = path.isAbsolute(rawPath)
    ? rawPath
    : path.resolve(process.cwd(), rawPath);

  if (!fs.existsSync(credentialsPath)) {
    throw new Error(`Google credentials dosyası bulunamadı: ${credentialsPath}`);
  }

  return new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: GOOGLE_SHEETS_SCOPES,
  });
}

export function getGoogleSheetsClient() {
  const auth = getGoogleSheetsAuth();

  return google.sheets({
    version: "v4",
    auth,
  });
}

import { readFileSync } from "node:fs";
import type { Config } from "./types.js";

export function loadConfig(): Config {
  const timetreeEmail = requireEnv("TIMETREE_EMAIL");
  const timetreePassword = requireEnv("TIMETREE_PASSWORD");
  const timetreeCalendarCode = requireEnv("TIMETREE_CALENDAR_CODE");
  const googleCalendarId = requireEnv("GOOGLE_CALENDAR_ID");

  const credentialsPath = requireEnv("GOOGLE_APPLICATION_CREDENTIALS");
  const googleCredentials = JSON.parse(
    readFileSync(credentialsPath, "utf-8")
  ) as Record<string, unknown>;

  const icsFilePath = process.env.ICS_FILE_PATH ?? "/tmp/timetree.ics";

  return {
    timetreeEmail,
    timetreePassword,
    timetreeCalendarCode,
    googleCalendarId,
    googleCredentials,
    icsFilePath,
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

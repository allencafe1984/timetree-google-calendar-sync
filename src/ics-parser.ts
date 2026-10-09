import { readFileSync } from "node:fs";
import ical, { type VEvent, type ParameterValue } from "node-ical";
import type { CalendarEvent } from "./types.js";

/**
 * ICS ファイルをパースして CalendarEvent 配列を返す
 */
export function parseIcsFile(filePath: string): CalendarEvent[] {
  const content = readFileSync(filePath, "utf-8");
  const parsed = ical.sync.parseICS(content);
  const events: CalendarEvent[] = [];

  for (const component of Object.values(parsed)) {
    if (!component || component.type !== "VEVENT") continue;

    const vevent = component as VEvent;
    if (!vevent.end) continue;

    const allDay = vevent.datetype === "date";

    events.push({
      uid: vevent.uid,
      summary: parameterValueToString(vevent.summary),
      description: parameterValueToString(vevent.description),
      location: parameterValueToString(vevent.location),
      start: new Date(vevent.start),
      end: new Date(vevent.end),
      allDay,
      recurrence: extractRecurrence(vevent, allDay),
      startTimezone: extractTzid(content, vevent.uid),
      lastModified: vevent.lastmodified ? new Date(vevent.lastmodified) : null,
    });
  }

  return events;
}

/** ParameterValue<string> を plain string に変換 */
function parameterValueToString(value: ParameterValue | undefined): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.val;
}

/**
 * node-ical の rrule.toString() は "DTSTART...\nRRULE:..." の形で
 * DTSTART 行を含むことがあるため、RRULE 行のみを抽出する。
 * また、終日イベントでは UNTIL も日付形式に揃える（RFC 5545 互換性）。
 */
function extractRecurrence(vevent: VEvent, allDay: boolean): string[] {
  const rules: string[] = [];

  if (vevent.rrule) {
    const rruleStr = vevent.rrule.toString();
    if (rruleStr) {
      let line = rruleStr
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find((l) => l.startsWith("RRULE:"));

      if (!line && rruleStr.startsWith("RRULE:")) {
        line = rruleStr;
      }

      if (line) {
        if (allDay) {
          // 終日イベントの UNTIL は日付のみにする（例: UNTIL=20261031T000000Z → UNTIL=20261031）
          line = line.replace(/UNTIL=(\d{8})T\d{6}Z?/, "UNTIL=$1");
        }
        rules.push(line);
      }
    }
  }

  return rules;
}

/** ICS の生テキストから DTSTART の TZID パラメータを抽出 */
function extractTzid(content: string, uid: string): string | null {
  const block = content.split("BEGIN:VEVENT").find((b) => b.includes(`UID:${uid}`));
  if (!block) return null;
  const match = block.match(/DTSTART;TZID=([^:;\r\n]+)/);
  return match ? match[1] : null;
}

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
      recurrence: extractRecurrence(vevent),
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

function extractRecurrence(vevent: VEvent): string[] {
  const rules: string[] = [];

  if (vevent.rrule) {
    const rruleStr = vevent.rrule.toString();
    if (rruleStr) {
      rules.push(
        rruleStr.startsWith("RRULE:") ? rruleStr : `RRULE:${rruleStr}`
      );
    }
  }

  return rules;
}

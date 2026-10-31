import type { TimetableSectionType } from "./timetable";

export const timetableDays = ["M", "T", "W", "Th", "F", "S"];
export const timetableDayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export type TimetableCell = Omit<TimetableSectionType, "roomTime"> & {
  code: string;
  room: string;
  day: number;
  hour: number;
  span: number;
  /** Set by the surface while a section animates in or out. */
  presence?: "present" | "entering" | "leaving";
};

export function buildTimetableGrid(sections: TimetableSectionType[]) {
  const slots = new Map<string, TimetableCell>();
  let dayCount = 5;
  let hourCount = 9;
  for (const section of sections) {
    for (const time of section.roomTime) {
      const [code, room, dayName, hourValue] = time.split(":");
      const day = timetableDays.indexOf(dayName);
      const hour = Number(hourValue) - 1;
      if (day < 0 || !Number.isInteger(hour) || hour < 0 || hour >= 13)
        continue;
      slots.set(`${day}:${hour}`, {
        ...section,
        code,
        room,
        day,
        hour,
        span: 1,
      });
      dayCount = Math.max(dayCount, day + 1);
      hourCount = Math.max(hourCount, hour + 1);
    }
  }
  const cells: TimetableCell[] = [];
  for (let day = 0; day < dayCount; day++) {
    for (let hour = 0; hour < hourCount; hour++) {
      const cell = slots.get(`${day}:${hour}`);
      if (!cell) continue;
      while (hour + cell.span < hourCount) {
        const next = slots.get(`${day}:${hour + cell.span}`);
        if (!next || next.id !== cell.id || next.room !== cell.room) break;
        cell.span++;
      }
      cells.push(cell);
      hour += cell.span - 1;
    }
  }
  return { cells, dayCount, hourCount };
}

export type AgendaItem =
  | { kind: "class"; cell: TimetableCell }
  | { kind: "free"; from: number; to: number };

export function buildAgenda(cells: TimetableCell[], day: number): AgendaItem[] {
  const dayCells = cells
    .filter((cell) => cell.day === day)
    .sort((a, b) => a.hour - b.hour);
  const items: AgendaItem[] = [];
  let prevEnd: number | null = null;
  for (const cell of dayCells) {
    if (prevEnd !== null && cell.hour > prevEnd) {
      items.push({ kind: "free", from: prevEnd, to: cell.hour });
    }
    items.push({ kind: "class", cell });
    prevEnd = Math.max(prevEnd ?? 0, cell.hour + cell.span);
  }
  return items;
}

export function defaultDay(dayCount: number, now: Date): number {
  const dow = now.getDay();
  if (dow >= 1 && dow <= 5) return dow - 1;
  if (dow === 6 && dayCount === 6) return 5;
  return 0;
}

export function nowPosition(
  now: Date,
  dayCount: number,
  hourCount: number,
): { day: number; hour: number; fraction: number } | null {
  const dow = now.getDay();
  if (dow === 0) return null;
  const day = dow - 1;
  if (day >= dayCount) return null;
  const hour = now.getHours() - 8;
  if (hour < 0 || hour >= hourCount) return null;
  return { day, hour, fraction: now.getMinutes() / 60 };
}

/**
 * Class for a desktop rows hour label: fades out while the now pill (centred
 * on the line, about 0.4 of an hour wide either side) would cover it. A label
 * runs about half an hour to the right of its hour.
 */
export function hourLabelFade(hour: number, nowAt: number | null): string {
  const near = nowAt !== null && nowAt - 0.9 < hour && hour < nowAt + 0.4;
  return `transition-opacity duration-(--d-2) ${near ? "opacity-0" : ""}`;
}

export function splitCode(code: string): { dept: string; number: string } {
  const i = code.lastIndexOf(" ");
  if (i < 0) return { dept: "", number: code };
  return { dept: code.slice(0, i), number: code.slice(i + 1) };
}

export function blockName(cell: TimetableCell): string {
  return `tt-${cell.id}-${cell.day}-${cell.hour}`.replace(
    /[^a-zA-Z0-9_-]/g,
    "_",
  );
}

export function titleCase(name: string): string {
  return name
    .split(" ")
    .map((word) =>
      /^[IVX]+$/i.test(word)
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");
}

export function parseTiming(entry: string) {
  const match = /^(Th|M|T|W|F|S)(\d{1,2})$/.exec(
    entry.slice(entry.lastIndexOf(":") + 1),
  );
  if (!match) return null;
  const day = timetableDays.indexOf(match[1]);
  const hour = Number(match[2]) - 1;
  if (day < 0 || hour < 0 || hour >= 13) return null;
  return { day, hour };
}

export function buildTimingsPreview(timings: readonly string[]) {
  const filled = new Set<string>();
  let dayCount = 5;
  let hourCount = 9;
  for (const entry of timings) {
    const slot = parseTiming(entry);
    if (!slot) continue;
    filled.add(`${slot.day}:${slot.hour}`);
    dayCount = Math.max(dayCount, slot.day + 1);
    hourCount = Math.max(hourCount, slot.hour + 1);
  }
  return { dayCount, hourCount, filled };
}

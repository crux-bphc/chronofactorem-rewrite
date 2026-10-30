import { timetableDays } from "@/utils/timetableGrid";

const clockFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});
const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});
const headingFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

export const formatClock = (d: Date): string => clockFormat.format(d);

export const formatRange = (start: Date, end: Date): string =>
  `${formatClock(start)} – ${formatClock(end)}`;

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export function formatExam(start: string | null, end: string | null): string {
  if (!start || !end) return "N/A";
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "N/A";
  const endText = sameDay(s, e)
    ? formatClock(e)
    : `${dateFormat.format(e)}, ${formatClock(e)}`;
  return `${dateFormat.format(s)}, ${formatClock(s)} – ${endText}`;
}

export const formatDayHeading = (d: Date): string => headingFormat.format(d);

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const hourClock = (hour: number, minute: number) =>
  formatClock(new Date(2000, 0, 1, hour, minute));

/**
 * Turns `CODE:ROOM:DAY:HOUR` entries (hour 1-based, 1 = 8 AM) into lines such
 * as `Mon, Wed, Fri · 9:00 AM – 9:50 AM · F102`.
 */
export function summarizeRoomTimes(roomTime: string[]): string[] {
  const hoursByRoomDay = new Map<string, number[]>();
  for (const entry of roomTime) {
    const parts = entry.split(":");
    const room = parts[1];
    // Real data is CODE:ROOM:DAY:HOUR; also accept a fused DAYHOUR (e.g. T6).
    const [dayName, hourValue] =
      parts.length >= 4
        ? [parts[2], parts[3]]
        : (parts[2]?.match(/^([A-Za-z]+)(\d+)$/)?.slice(1) ?? []);
    const day = timetableDays.indexOf(dayName);
    const hour = Number(hourValue);
    if (day < 0 || !Number.isInteger(hour) || hour < 1) continue;
    const key = `${room}\u0000${day}`;
    const list = hoursByRoomDay.get(key) ?? [];
    if (!list.includes(hour)) list.push(hour);
    hoursByRoomDay.set(key, list);
  }

  const merged = new Map<
    string,
    { room: string; from: number; to: number; days: number[] }
  >();
  for (const [key, hours] of hoursByRoomDay) {
    const [room, dayText] = key.split("\u0000");
    const day = Number(dayText);
    hours.sort((a, b) => a - b);
    let from = hours[0];
    let prev = hours[0];
    const flush = () => {
      const mergeKey = `${room}\u0000${from}\u0000${prev}`;
      const item = merged.get(mergeKey) ?? { room, from, to: prev, days: [] };
      item.days.push(day);
      merged.set(mergeKey, item);
    };
    for (const hour of hours.slice(1)) {
      if (hour !== prev + 1) {
        flush();
        from = hour;
      }
      prev = hour;
    }
    flush();
  }

  return [...merged.values()]
    .map((item) => ({ ...item, days: item.days.sort((a, b) => a - b) }))
    .sort((a, b) => a.days[0] - b.days[0] || a.from - b.from)
    .map(
      (item) =>
        `${item.days.map((d) => dayLabels[d]).join(", ")} · ${hourClock(7 + item.from, 0)} – ${hourClock(7 + item.to, 50)} · ${item.room}`,
    );
}

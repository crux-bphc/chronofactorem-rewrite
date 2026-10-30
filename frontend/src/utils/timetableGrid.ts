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

const courseColors = [
  "bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-800",
  "bg-sky-100 text-sky-950 border-sky-300 dark:bg-sky-950 dark:text-sky-100 dark:border-sky-800",
  "bg-violet-100 text-violet-950 border-violet-300 dark:bg-violet-950 dark:text-violet-100 dark:border-violet-800",
  "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-800",
  "bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950 dark:text-rose-100 dark:border-rose-800",
  "bg-cyan-100 text-cyan-950 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-100 dark:border-cyan-800",
];

export function courseColor(code: string) {
  const hash = [...code].reduce(
    (value, letter) => (value * 31 + letter.charCodeAt(0)) >>> 0,
    0,
  );
  return courseColors[hash % courseColors.length];
}

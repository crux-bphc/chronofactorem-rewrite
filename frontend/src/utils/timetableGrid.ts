import type { TimetableSectionType } from "./timetable";

export const timetableDays = ["M", "T", "W", "Th", "F", "S"];

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

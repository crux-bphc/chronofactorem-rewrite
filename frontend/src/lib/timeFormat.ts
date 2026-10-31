const dateTime = (d: Date) =>
  d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const time = (d: Date) =>
  d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

const sameLocalDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * "Oct 5, 9:30 AM – 11:00 AM" on one local day,
 * "Oct 5, 11:00 PM – Oct 6, 1:00 AM" across days.
 */
export function formatExamRange(start: Date, end: Date): string {
  return sameLocalDay(start, end)
    ? `${dateTime(start)} – ${time(end)}`
    : `${dateTime(start)} – ${dateTime(end)}`;
}

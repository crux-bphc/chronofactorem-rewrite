const gridStartHour = 8;

function to12h(hour24: number) {
  const h = ((hour24 % 24) + 24) % 24;
  return { h12: h % 12 === 0 ? 12 : h % 12, suffix: h < 12 ? "AM" : "PM" };
}

/** `hour` is a 0-based grid hour, so 0 is 8 AM. */
export function formatClock(hour: number, minute = 0): string {
  const { h12, suffix } = to12h(hour + gridStartHour);
  return `${h12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

/** The end of a slot run: a span of n slots from `hour` ends at (hour+n-1):50. */
export function formatSlotEnd(hour: number, span: number): string {
  return formatClock(hour + span - 1, 50);
}

export function formatSlotRange(hour: number, span: number): string {
  return `${formatClock(hour)} – ${formatSlotEnd(hour, span)}`;
}

export function formatAxisHour(hour: number): string {
  const { h12, suffix } = to12h(hour + gridStartHour);
  return `${h12} ${suffix}`;
}

export function formatNow(date: Date): string {
  const { h12, suffix } = to12h(date.getHours());
  return `${h12}:${String(date.getMinutes()).padStart(2, "0")} ${suffix}`;
}

import type { CSSProperties } from "react";
import { buildTimingsPreview } from "@/utils/timetableGrid";

export function TimetablePreview({
  timings,
  style,
}: {
  timings: readonly string[] | undefined;
  style?: CSSProperties;
}) {
  const { dayCount, hourCount, filled } = buildTimingsPreview(timings ?? []);
  const cells = [];
  for (let day = 0; day < dayCount; day++) {
    for (let hour = 0; hour < hourCount; hour++) {
      cells.push(
        <i
          key={`${day}:${hour}`}
          className={`rounded-[1.5px] ${filled.has(`${day}:${hour}`) ? "bg-ink-muted/55" : "bg-ev"}`}
        />,
      );
    }
  }
  return (
    <div
      aria-hidden="true"
      className="w-[92px] h-16 shrink-0 rounded-[8px] border border-line bg-bg p-[5px] grid gap-[1.5px]"
      style={{
        gridTemplateColumns: `repeat(${hourCount}, 1fr)`,
        gridTemplateRows: `repeat(${dayCount}, 1fr)`,
        ...style,
      }}
    >
      {cells}
    </div>
  );
}

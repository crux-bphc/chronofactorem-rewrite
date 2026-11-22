import type { CSSProperties } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { courseHues, hueStyle } from "@/lib/courseHues";
import { buildTimingsPreview } from "@/utils/timetableGrid";

export function TimetablePreview({
  timings,
  style,
}: {
  timings: readonly string[] | undefined;
  style?: CSSProperties;
}) {
  const { colorSeed } = useTheme();
  const { dayCount, hourCount, filled } = buildTimingsPreview(timings ?? []);
  const hues = courseHues(filled.values(), colorSeed);
  const cells = [];
  for (let day = 0; day < dayCount; day++) {
    for (let hour = 0; hour < hourCount; hour++) {
      const code = filled.get(`${day}:${hour}`);
      cells.push(
        <i
          key={`${day}:${hour}`}
          className={`rounded-[1.5px] ${code === undefined ? "bg-sunk" : "course-tint bg-ev"}`}
          style={code === undefined ? undefined : hueStyle(hues.get(code))}
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

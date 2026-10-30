import { useMemo } from "react";
import { TimetableGrid } from "@/components/TimetableGrid";
import type { TimetableSectionType } from "@/utils/timetable";
import { buildTimetableGrid, type TimetableCell } from "@/utils/timetableGrid";
import { Agenda } from "./Agenda";
import { WeekGrid } from "./WeekGrid";

export type SurfaceMode = "edit" | "view" | "export";
export type Orientation = "rows" | "columns";

export type SurfaceProps = {
  sections: TimetableSectionType[];
  layout: "phone" | "desktop";
  view: "day" | "week"; // phone only
  day: number; // phone day view
  orientation: Orientation; // desktop only
  mode: SurfaceMode;
  showNow?: boolean;
  preview?: TimetableSectionType | null;
  pending?: boolean;
  onOpen?: (
    cell: TimetableCell,
    event: React.MouseEvent | React.KeyboardEvent,
  ) => void;
  onRemove?: (cell: TimetableCell) => void;
};

export function TimetableSurface({
  sections,
  layout,
  view,
  day,
  orientation,
  mode,
  pending,
  onOpen,
  onRemove,
}: SurfaceProps) {
  const { cells, dayCount, hourCount } = useMemo(
    () => buildTimetableGrid(sections),
    [sections],
  );

  if (layout === "phone" && view === "day") {
    return (
      <section aria-label="Weekly timetable">
        <Agenda
          cells={cells}
          day={Math.min(day, dayCount - 1)}
          mode={mode}
          pending={pending}
          onOpen={onOpen}
          onRemove={onRemove}
        />
      </section>
    );
  }

  if (layout === "phone") {
    return (
      <section aria-label="Weekly timetable">
        <WeekGrid
          cells={cells}
          dayCount={dayCount}
          hourCount={hourCount}
          mode={mode}
          pending={pending}
          onOpen={onOpen}
          onRemove={onRemove}
        />
      </section>
    );
  }

  // Desktop still uses the old grid until C4.
  return (
    <TimetableGrid
      isVertical={layout === "desktop" ? orientation === "columns" : true}
      handleUnitClick={onOpen}
      handleUnitDelete={onRemove}
      isOnEditPage={mode === "edit"}
      hideControls
    />
  );
}

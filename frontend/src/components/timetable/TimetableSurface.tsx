import { useMemo } from "react";
import { useFadingValue } from "@/lib/sectionPreview";
import type { TimetableSectionType } from "@/utils/timetable";
import { buildTimetableGrid, type TimetableCell } from "@/utils/timetableGrid";
import { Agenda } from "./Agenda";
import { DeskGrid } from "./DeskGrid";
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
  preview,
  pending,
  onOpen,
  onRemove,
}: SurfaceProps) {
  // only the desktop editor ghosts the hovered picker section; it lingers
  // for --d-1 (120ms) after the hover ends so it can fade out
  const ghost = useFadingValue(
    layout === "desktop" && mode === "edit" ? (preview ?? null) : null,
    120,
  );
  const grid = useMemo(() => buildTimetableGrid(sections), [sections]);
  const { cells } = grid;
  // a ghost on Saturday or past the last hour grows the grid to fit
  const { dayCount, hourCount } = useMemo(
    () => (ghost.value ? buildTimetableGrid([...sections, ghost.value]) : grid),
    [sections, ghost.value, grid],
  );
  const ghostCells = useMemo(
    () => (ghost.value ? buildTimetableGrid([ghost.value]).cells : []),
    [ghost.value],
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

  return (
    <section aria-label="Weekly timetable" className="h-full">
      <DeskGrid
        cells={cells}
        dayCount={dayCount}
        hourCount={hourCount}
        orientation={orientation}
        mode={mode}
        pending={pending}
        onOpen={onOpen}
        onRemove={onRemove}
        ghostCells={ghostCells}
        ghostVisible={ghost.visible}
      />
    </section>
  );
}

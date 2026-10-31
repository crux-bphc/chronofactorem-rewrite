import { useMemo } from "react";
import { useFadingValue } from "@/lib/sectionPreview";
import { useNow } from "@/lib/useNow";
import { useSectionPresence } from "@/lib/useSectionPresence";
import { formatNow } from "@/utils/timeFormat";
import type { TimetableSectionType } from "@/utils/timetable";
import {
  buildTimetableGrid,
  nowPosition,
  type TimetableCell,
} from "@/utils/timetableGrid";
import { Agenda } from "./Agenda";
import { DeskGrid } from "./DeskGrid";
import { NowLine } from "./NowLine";
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
  showNow,
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
  // sections that were just removed stay (leaving) until they finish collapsing,
  // and still count towards the layout; the export never animates
  const presence = useSectionPresence(sections, {
    disabled: mode === "export",
  });
  const { cells, base } = useMemo(() => {
    const live = presence.filter((p) => p.presence !== "leaving");
    const gone = presence.filter((p) => p.presence === "leaving");
    const kinds = new Map(live.map((p) => [p.section.id, p.presence]));
    const liveGrid = buildTimetableGrid(live.map((p) => p.section));
    const goneGrid = buildTimetableGrid(gone.map((p) => p.section));
    // leaving cells go first so a replacement paints over the section it replaces
    const cells: TimetableCell[] = [
      ...goneGrid.cells.map((c) => ({ ...c, presence: "leaving" as const })),
      ...liveGrid.cells.map((c) => ({ ...c, presence: kinds.get(c.id) })),
    ];
    return {
      cells,
      base: {
        dayCount: Math.max(liveGrid.dayCount, goneGrid.dayCount),
        hourCount: Math.max(liveGrid.hourCount, goneGrid.hourCount),
      },
    };
  }, [presence]);
  // a ghost on Saturday or past the last hour grows the grid to fit
  const { dayCount, hourCount } = useMemo(() => {
    if (!ghost.value) return base;
    const g = buildTimetableGrid([ghost.value]);
    return {
      dayCount: Math.max(base.dayCount, g.dayCount),
      hourCount: Math.max(base.hourCount, g.hourCount),
    };
  }, [base, ghost.value]);
  const ghostCells = useMemo(
    () => (ghost.value ? buildTimetableGrid([ghost.value]).cells : []),
    [ghost.value],
  );

  // the now-line belongs to the live view page only, never the editor or export
  const date = useNow(mode === "view" && !!showNow);
  const pos = date ? nowPosition(date, dayCount, hourCount) : null;
  const label = date ? formatNow(date) : "";
  const nowAt = pos ? pos.hour + pos.fraction : null;

  if (layout === "phone" && view === "day") {
    const shown = Math.min(day, dayCount - 1);
    return (
      <section aria-label="Weekly timetable">
        <Agenda
          cells={cells}
          day={shown}
          mode={mode}
          now={
            pos && pos.day === shown
              ? { hour: pos.hour, fraction: pos.fraction, label }
              : null
          }
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
          nowAt={nowAt}
          now={
            pos && (
              <NowLine.Grid
                pos={pos}
                axis="y"
                label={label}
                cell={{ gridColumn: pos.day + 2, gridRow: pos.hour + 2 }}
                track={{ gridColumn: 1, gridRow: pos.hour + 2 }}
                labelClass="bg-bg"
              />
            )
          }
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
        nowAt={nowAt}
        now={
          pos && (
            <NowLine.Grid
              pos={pos}
              axis={orientation === "rows" ? "x" : "y"}
              label={label}
              cell={
                orientation === "rows"
                  ? { gridRow: pos.day + 2, gridColumn: pos.hour + 2 }
                  : { gridColumn: pos.day + 2, gridRow: pos.hour + 2 }
              }
              track={
                orientation === "rows"
                  ? { gridRow: 1, gridColumn: pos.hour + 2 }
                  : { gridColumn: 1, gridRow: pos.hour + 2 }
              }
              labelClass="bg-surface"
            />
          )
        }
      />
    </section>
  );
}

import { X } from "lucide-react";
import { TileBody } from "@/components/timetable/WeekGrid";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { titleCase as nameCase } from "@/lib/titleCase";
import { formatAxisHour } from "@/utils/timeFormat";
import {
  blockName,
  type TimetableCell,
  timetableDayNames,
  titleCase,
} from "@/utils/timetableGrid";
import { EmptyState, emptyTimetableHint } from "./EmptyState";

const vtStyle = (cell: TimetableCell) =>
  ({ "--vt": blockName(cell) }) as React.CSSProperties;

type DeskGridProps = {
  cells: TimetableCell[];
  dayCount: number;
  hourCount: number;
  orientation: "rows" | "columns";
  mode: "edit" | "view" | "export";
  pending?: boolean;
  onOpen?: (
    cell: TimetableCell,
    event: React.MouseEvent | React.KeyboardEvent,
  ) => void;
  onRemove?: (cell: TimetableCell) => void;
  ghostCells?: TimetableCell[];
  ghostVisible?: boolean;
  outgoing?: string | null;
  /** The now-line slot (C5). */
  now?: React.ReactNode;
};

// blocks are size containers: under 72px wide they stack dept / number like
// the phone tiles instead of truncating the code
const padClass = "px-2.5 py-[9px] @max-[72px]:px-1 @max-[72px]:py-1.5";

// on big monitors the live grid's text steps up a size at 1920px and again
// at 2560px so it stays in proportion with the much larger blocks. the export
// keeps one size whatever screen it is made on.
// on screen a code wraps whole words rather than truncating; the editor's ×
// is always shown (as on master), so there the code floats a spacer under it
// and words that would run under it wrap below it. the export truncates.
// with days across, blocks share their day's width, so from 120px wide each
// has room for the course name, which leads and truncates (the tooltip has it
// in full) with the code moving down a line. with hours across, a block's
// width follows its length, so the code stays and a course reads the same in
// every block.
function BlockLines({
  cell,
  scale,
  named,
  remove = false,
}: {
  cell: TimetableCell;
  scale: boolean;
  named: boolean;
  remove?: boolean;
}) {
  const size = scale
    ? "text-base min-[1920px]:text-lg min-[2560px]:text-xl min-[3200px]:text-2xl"
    : "text-base";
  const subSize = scale
    ? "text-sm min-[1920px]:text-base min-[2560px]:text-lg min-[3200px]:text-xl"
    : "text-sm";
  return (
    <>
      {named && (
        <div className="hidden @min-[120px]:block">
          <span
            className={`block truncate leading-tight font-semibold ${size} ${remove ? "pr-4" : ""}`}
          >
            {nameCase(cell.name)}
          </span>
          <span className={`mt-[3px] block truncate text-ink-muted ${subSize}`}>
            {`${cell.code} · ${cell.type}${cell.number} · ${cell.room}`}
          </span>
        </div>
      )}
      <div
        className={`@max-[72px]:hidden ${named ? "@min-[120px]:hidden" : ""}`}
      >
        <span
          className={`block font-semibold ${size} ${
            scale ? "leading-tight" : "truncate"
          }`}
        >
          {remove && (
            <span aria-hidden="true" className="float-right h-[1em] w-4" />
          )}
          {cell.code}
        </span>
        <span className={`mt-[3px] block truncate text-ink-muted ${subSize}`}>
          {`${cell.type}${cell.number} · ${cell.room}`}
        </span>
      </div>
      <div className="hidden leading-[1.15] @max-[72px]:block">
        <TileBody cell={cell} spacer={remove ? "h-3 w-5" : undefined} />
      </div>
    </>
  );
}

export function DeskGrid({
  cells,
  dayCount,
  hourCount,
  orientation,
  mode,
  pending,
  onOpen,
  onRemove,
  ghostCells = [],
  ghostVisible = false,
  outgoing,
  now,
}: DeskGridProps) {
  const rows = orientation === "rows";
  // a cell's place: days down the side and hours across, or transposed
  const place = (day: number, hour: number, span = 1) =>
    rows
      ? { gridRow: day + 2, gridColumn: `${hour + 2} / span ${span}` }
      : { gridColumn: day + 2, gridRow: `${hour + 2} / span ${span}` };
  const days = timetableDayNames.slice(0, dayCount);
  const hours = Array.from({ length: hourCount }, (_, h) => h);

  return (
    <div
      className={`tt-desk relative grid h-full gap-1 rounded-xl border border-line bg-surface px-4 pt-3 pb-4 ${
        mode === "export" ? "overflow-visible" : "overflow-auto"
      }`}
      style={
        rows
          ? {
              gridTemplateColumns: `48px repeat(${hourCount}, minmax(38px, 1fr))`,
              gridTemplateRows: `26px repeat(${dayCount}, minmax(72px, 1fr))`,
            }
          : {
              gridTemplateColumns: `48px repeat(${dayCount}, minmax(86px, 1fr))`,
              gridTemplateRows: `26px repeat(${hourCount}, minmax(${mode === "export" ? 56 : 44}px, 1fr))`,
            }
      }
    >
      {days.map((name, d) => (
        <div
          key={name}
          className={`self-center font-semibold tracking-[.06em] text-ink-muted uppercase ${
            mode === "export"
              ? "text-xs"
              : "text-xs min-[1920px]:text-sm min-[2560px]:text-base min-[3200px]:text-lg"
          } ${rows ? "" : "text-center"}`}
          style={
            rows
              ? { gridColumn: 1, gridRow: d + 2 }
              : { gridColumn: d + 2, gridRow: 1 }
          }
        >
          {name.slice(0, 3)}
        </div>
      ))}
      {hours.map((h) => (
        <div
          key={`hour-${h}`}
          className={`whitespace-nowrap text-ink-faint ${
            mode === "export"
              ? "text-sm"
              : "text-sm min-[1920px]:text-base min-[2560px]:text-lg min-[3200px]:text-xl"
          } ${rows ? "self-end pl-0.5" : "self-start pr-1 text-right"}`}
          style={
            rows
              ? { gridColumn: h + 2, gridRow: 1 }
              : { gridColumn: 1, gridRow: h + 2, transform: "translateY(-8px)" }
          }
        >
          {formatAxisHour(h)}
        </div>
      ))}
      {/* one line above each day row (or hour row), centred in the gap and
      drawn before the blocks so they cover it */}
      {(rows ? days : hours).map((_, i) => (
        <div
          key={`line-${i}`}
          aria-hidden="true"
          className="pointer-events-none -translate-y-[2.5px] self-start border-gridline border-t"
          style={{ gridColumn: "2 / -1", gridRow: i + 2 }}
        />
      ))}
      {mode !== "export" && cells.length === 0 && ghostCells.length === 0 && (
        <EmptyState
          hint={emptyTimetableHint(mode)}
          className="z-1 self-center justify-self-center px-4"
          style={{ gridColumn: "2 / -1", gridRow: "2 / -1" }}
        />
      )}
      {cells.map((cell) => {
        const key = `${cell.id}-${cell.day}-${cell.hour}`;
        const style = place(cell.day, cell.hour, cell.span);
        if (mode === "export") {
          return (
            <div
              key={key}
              style={style}
              data-presence="present"
              className={
                "@container relative z-1 min-w-0 overflow-hidden rounded-md bg-ev"
              }
            >
              <div className={padClass}>
                <BlockLines cell={cell} scale={false} named={!rows} />
              </div>
            </div>
          );
        }
        const edit = mode === "edit";
        const leaving = cell.presence === "leaving";
        const going = !leaving && cell.id === outgoing;
        return (
          <div
            key={key}
            // live blocks carry their morph name (C7); export and leaving don't
            style={leaving ? style : { ...style, ...vtStyle(cell) }}
            data-presence={cell.presence ?? "present"}
            data-outgoing={going ? "" : undefined}
            inert={leaving}
            className={`@container relative z-1 min-w-0 overflow-hidden rounded-md ${
              going ? "tt-outgoing" : "bg-ev"
            } ${leaving ? "" : "tt-block"} ${
              edit
                ? "hover:bg-ev-hover hover:shadow-[inset_0_0_0_1.5px_var(--ink)]"
                : ""
            }`}
          >
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                {edit ? (
                  <button
                    type="button"
                    disabled={pending || leaving}
                    onClick={
                      leaving ? undefined : (event) => onOpen?.(cell, event)
                    }
                    onKeyDown={
                      leaving
                        ? undefined
                        : (event) => {
                            if (
                              event.key === "Delete" ||
                              event.key === "Backspace"
                            ) {
                              event.preventDefault();
                              onRemove?.(cell);
                            }
                          }
                    }
                    aria-label={`Edit ${cell.courseId} ${cell.type}${cell.number}, press Delete to remove`}
                    className={`flex size-full cursor-pointer flex-col justify-start rounded-md text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-60 ${padClass}`}
                  >
                    <BlockLines cell={cell} scale named={!rows} remove />
                  </button>
                ) : (
                  <div className={`size-full ${padClass}`}>
                    <BlockLines cell={cell} scale named={!rows} />
                  </div>
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p>{titleCase(cell.name)}</p>
                {edit && <p className="opacity-75">(Double tap to remove)</p>}
              </TooltipContent>
            </Tooltip>
            {edit && (
              <button
                type="button"
                disabled={pending || leaving}
                aria-label={`Remove ${cell.code} ${cell.type}${cell.number}`}
                onClick={leaving ? undefined : () => onRemove?.(cell)}
                className="absolute top-1 right-1 flex size-5 cursor-pointer items-center justify-center rounded-sm text-ink-muted transition-colors duration-(--d-1) hover:bg-ev-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-default"
              >
                <X size={13} />
              </button>
            )}
          </div>
        );
      })}
      {mode === "edit" &&
        ghostCells.map((cell) => (
          <div
            key={`ghost-${cell.id}-${cell.day}-${cell.hour}`}
            data-ghost=""
            data-visible={ghostVisible ? "" : undefined}
            aria-hidden="true"
            style={place(cell.day, cell.hour, cell.span)}
            className={
              "@container tt-ghost pointer-events-none relative z-2 min-w-0 overflow-hidden rounded-md bg-surface/85 text-ink-muted outline-[1.5px] -outline-offset-[1.5px] outline-ink-faint outline-dashed [&_span]:text-ink-muted"
            }
          >
            <div className={padClass}>
              <BlockLines cell={cell} scale named={!rows} />
            </div>
          </div>
        ))}
      {now}
    </div>
  );
}

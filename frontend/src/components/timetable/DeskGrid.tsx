import { Bird, X } from "lucide-react";
import { TileBody } from "@/components/timetable/WeekGrid";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatAxisHour } from "@/utils/timeFormat";
import {
  blockName,
  hourLabelFade,
  type TimetableCell,
  timetableDayNames,
  titleCase,
} from "@/utils/timetableGrid";

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
  /** The hovered picker section, as cells (edit mode only). */
  ghostCells?: TimetableCell[];
  ghostVisible?: boolean;
  /** The now-line slot (C5). */
  now?: React.ReactNode;
  /** Now as hours since the first axis hour; hides the hour label it nears. */
  nowAt?: number | null;
};

// blocks are size containers: under 72px wide they stack dept / number like
// the phone tiles instead of truncating the code
const padClass = "px-2.5 py-[9px] @max-[72px]:px-1 @max-[72px]:py-1.5";

function BlockLines({ cell }: { cell: TimetableCell }) {
  return (
    <>
      <div className="@max-[72px]:hidden">
        <span className="block truncate text-base font-semibold">
          {cell.code}
        </span>
        <span className="mt-[3px] block truncate text-sm text-ink-muted">
          {`${cell.type}${cell.number} · ${cell.room}`}
        </span>
      </div>
      <div className="hidden leading-[1.15] @max-[72px]:block">
        <TileBody cell={cell} />
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
  now,
  nowAt = null,
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
              gridTemplateRows: `26px repeat(${hourCount}, minmax(44px, 1fr))`,
            }
      }
    >
      {days.map((name, d) => (
        <div
          key={name}
          className={`self-center text-xs font-semibold tracking-[.06em] text-ink-muted uppercase ${
            rows ? "" : "text-center"
          }`}
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
          className={`text-sm whitespace-nowrap text-ink-faint ${hourLabelFade(h, nowAt)} ${
            rows ? "self-end pl-0.5" : "self-start pr-1 text-right"
          }`}
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
      {cells.length === 0 && ghostCells.length === 0 && (
        <Bird
          role="img"
          aria-label="No classes"
          size={112}
          strokeWidth={1.25}
          className="z-1 self-center justify-self-center text-ink-faint"
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
                <BlockLines cell={cell} />
              </div>
            </div>
          );
        }
        const edit = mode === "edit";
        const leaving = cell.presence === "leaving";
        return (
          <div
            key={key}
            // live blocks carry their morph name (C7); export and leaving don't
            style={leaving ? style : { ...style, ...vtStyle(cell) }}
            data-presence={cell.presence ?? "present"}
            inert={leaving}
            className={`@container group relative z-1 min-w-0 overflow-hidden rounded-md bg-ev ${
              leaving ? "" : "tt-block"
            } ${
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
                    <BlockLines cell={cell} />
                  </button>
                ) : (
                  <div className={`size-full ${padClass}`}>
                    <BlockLines cell={cell} />
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
                className="absolute top-1 right-1 flex size-5 cursor-pointer items-center justify-center rounded-sm bg-ev-hover text-ink-muted opacity-0 transition-opacity duration-(--d-1) group-focus-within:opacity-100 group-hover:opacity-100 hover:text-ink focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-default"
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
              <BlockLines cell={cell} />
            </div>
          </div>
        ))}
      {now}
    </div>
  );
}

import { Bird, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatAxisHour } from "@/utils/timeFormat";
import {
  type TimetableCell,
  timetableDayNames,
  titleCase,
} from "@/utils/timetableGrid";

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
};

const padClass = "px-2.5 py-[9px]";

function BlockLines({
  cell,
  edit = false,
}: {
  cell: TimetableCell;
  edit?: boolean;
}) {
  return (
    <>
      <span
        className={`block truncate text-base font-semibold ${edit ? "pr-5" : ""}`}
      >
        {cell.code}
      </span>
      <span className="mt-[3px] block truncate text-sm text-ink-muted">
        {`${cell.type}${cell.number} · ${cell.room}`}
      </span>
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
          className={`text-sm whitespace-nowrap text-ink-faint ${
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
              className={`relative z-1 min-w-0 overflow-hidden rounded-md bg-ev ${padClass}`}
            >
              <BlockLines cell={cell} />
            </div>
          );
        }
        const edit = mode === "edit";
        return (
          <div
            key={key}
            style={style}
            className={`group relative z-1 min-w-0 overflow-hidden rounded-md bg-ev ${
              edit
                ? "transition-[background-color,box-shadow] duration-(--d-1) hover:bg-ev-hover hover:shadow-[inset_0_0_0_1.5px_var(--ink)]"
                : ""
            }`}
          >
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                {edit ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={(event) => onOpen?.(cell, event)}
                    onKeyDown={(event) => {
                      if (event.key === "Delete" || event.key === "Backspace") {
                        event.preventDefault();
                        onRemove?.(cell);
                      }
                    }}
                    aria-label={`Edit ${cell.courseId} ${cell.type}${cell.number}, press Delete to remove`}
                    className={`flex size-full cursor-pointer flex-col justify-start rounded-md text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-60 ${padClass}`}
                  >
                    <BlockLines cell={cell} edit />
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
                disabled={pending}
                aria-label={`Remove ${cell.code} ${cell.type}${cell.number}`}
                onClick={() => onRemove?.(cell)}
                className="absolute top-1.5 right-[7px] flex size-6 cursor-pointer items-center justify-center rounded-sm text-ink-muted opacity-0 transition-opacity duration-(--d-1) group-focus-within:opacity-100 group-hover:opacity-100 hover:text-ink focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-default"
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
            className={`tt-ghost pointer-events-none relative z-2 min-w-0 overflow-hidden rounded-md bg-surface/85 text-ink-muted outline-[1.5px] -outline-offset-[1.5px] outline-ink-faint outline-dashed ${padClass} [&_span]:text-ink-muted`}
          >
            <BlockLines cell={cell} />
          </div>
        ))}
      {now}
    </div>
  );
}

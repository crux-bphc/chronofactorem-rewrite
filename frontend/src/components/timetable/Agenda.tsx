import { Fragment, useEffect, useMemo, useRef } from "react";
import { formatClock, formatSlotEnd } from "@/utils/timeFormat";
import {
  blockName,
  buildAgenda,
  type TimetableCell,
  timetableDayNames,
  titleCase,
} from "@/utils/timetableGrid";
import { EmptyState, emptyTimetableHint } from "./EmptyState";
import { NowLine } from "./NowLine";

type AgendaProps = {
  cells: TimetableCell[];
  day: number;
  mode: "edit" | "view" | "export";
  pending?: boolean;
  /** Today's grid hour and the formatted time; set only when it is on this day. */
  now?: { hour: number; fraction: number; label: string } | null;
  onOpen?: (
    cell: TimetableCell,
    event: React.MouseEvent | React.KeyboardEvent,
  ) => void;
  onRemove?: (cell: TimetableCell) => void;
};

const blockClass =
  "flex w-full justify-between gap-2 rounded-lg bg-ev px-3 pt-[9px] pb-2.5 text-left";

// while the now-line runs through a block its text sits above the line with
// a halo of the block's colour, so the line reads as passing behind the text
// rather than striking it out
const haloClass =
  "relative z-1 [text-shadow:0_0_2px_var(--ev),0_0_2px_var(--ev),0_0_4px_var(--ev),0_0_4px_var(--ev)]";

function BlockBody({ cell, during }: { cell: TimetableCell; during: boolean }) {
  const halo = during ? haloClass : "";
  return (
    <>
      <span className={`min-w-0 ${halo}`}>
        <span className="block text-lg font-semibold">{cell.code}</span>
        <span className="block text-sm text-ink-muted">
          {titleCase(cell.name)}
        </span>
      </span>
      <span className={`shrink-0 text-right ${halo}`}>
        <span className="block whitespace-nowrap text-sm font-medium">
          {cell.room}
        </span>
        <span className="block text-sm text-ink-muted">
          {cell.type}
          {cell.number}
        </span>
      </span>
    </>
  );
}

export function Agenda({
  cells,
  day,
  mode,
  pending,
  now,
  onOpen,
  onRemove,
}: AgendaProps) {
  const items = useMemo(() => buildAgenda(cells, day), [cells, day]);
  // free rows that appear later (a removal opens a gap) grow in like blocks
  const seen = useRef<{ day: number; keys: Set<string> } | null>(null);
  const freeKeys = new Set(
    items.flatMap((i) => (i.kind === "free" ? [`free-${i.from}`] : [])),
  );
  const prior = seen.current?.day === day ? seen.current.keys : null;
  useEffect(() => {
    seen.current = { day, keys: freeKeys };
  });
  // the item the now-line follows: the free gap or the class holding this
  // hour. before the first class or after the last, there is none.
  const nowIndex = now
    ? items.findIndex((item) =>
        item.kind === "free"
          ? item.from <= now.hour && now.hour < item.to
          : item.cell.hour <= now.hour &&
            now.hour < item.cell.hour + item.cell.span,
      )
    : -1;

  if (items.length === 0) {
    return (
      <div className="tt-agenda flex justify-center px-4 py-12">
        <EmptyState
          hint={
            cells.length === 0
              ? emptyTimetableHint(mode)
              : `No classes on ${timetableDayNames[day]}.`
          }
        />
      </div>
    );
  }

  // live blocks carry their morph name (C7); it only applies during a morph
  const named = (cell: TimetableCell) =>
    cell.presence === "leaving" || mode === "export"
      ? { className: "", style: undefined }
      : {
          className: "tt-block",
          style: { "--vt": blockName(cell) } as React.CSSProperties,
        };

  // the 10 minutes after a class are its break, not part of it. during the
  // class the now-line runs through its block at the share gone by (0–1)
  const elapsed = (cell: TimetableCell) =>
    now ? (now.hour + now.fraction - cell.hour) / (cell.span - 1 / 6) : -1;
  const isDuring = (cell: TimetableCell) => {
    const at = elapsed(cell);
    return at >= 0 && at < 1;
  };
  // the time column's start and end times sit at 10–30px and 30–50px of a
  // ~67px row; the one the now time would sit on fades out for it
  const covered = (cell: TimetableCell) => {
    if (!isDuring(cell)) return { start: false, end: false };
    const y = Math.min(Math.max(elapsed(cell) * 67, 10), 57);
    return { start: y < 40, end: y > 20 && y < 60 };
  };

  return (
    <div className="tt-agenda px-4">
      {items.map((item, i) => (
        <Fragment
          key={
            item.kind === "free"
              ? `free-${item.from}`
              : `${item.cell.id}-${item.cell.hour}`
          }
        >
          {item.kind === "free" ? (
            <div
              className="tt-row"
              data-row-presence={
                prior && !prior.has(`free-${item.from}`)
                  ? "entering"
                  : undefined
              }
            >
              <div className="min-h-0 overflow-hidden">
                <div className="mb-1.5 grid grid-cols-[64px_1fr] gap-3">
                  <div className="col-start-2 pt-1 pb-2.5 pl-0.5 text-sm text-ink-faint">
                    {`Free · ${formatClock(item.from)} – ${formatClock(item.to)}`}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="tt-row" data-row-presence={item.cell.presence}>
              <div className="min-h-0 overflow-hidden">
                <div className="relative mb-1.5 grid grid-cols-[64px_1fr] gap-3">
                  <div className="pt-2.5 text-right">
                    <div
                      className={`whitespace-nowrap text-sm font-medium transition-opacity duration-(--d-2) ${covered(item.cell).start ? "opacity-0" : ""}`}
                    >
                      {formatClock(item.cell.hour)}
                    </div>
                    <div
                      className={`whitespace-nowrap text-sm text-ink-faint transition-opacity duration-(--d-2) ${covered(item.cell).end ? "opacity-0" : ""}`}
                    >
                      {formatSlotEnd(item.cell.hour, item.cell.span)}
                    </div>
                  </div>
                  {mode === "edit" ? (
                    <button
                      type="button"
                      disabled={pending || item.cell.presence === "leaving"}
                      inert={item.cell.presence === "leaving"}
                      data-presence={item.cell.presence ?? "present"}
                      onClick={
                        item.cell.presence === "leaving"
                          ? undefined
                          : (event) => onOpen?.(item.cell, event)
                      }
                      onKeyDown={
                        item.cell.presence === "leaving"
                          ? undefined
                          : (event) => {
                              if (
                                event.key === "Delete" ||
                                event.key === "Backspace"
                              ) {
                                event.preventDefault();
                                onRemove?.(item.cell);
                              }
                            }
                      }
                      aria-label={`Edit ${item.cell.courseId} ${item.cell.type}${item.cell.number}, press Delete to remove`}
                      style={named(item.cell).style}
                      className={`${blockClass} ${named(item.cell).className} cursor-pointer hover:bg-ev-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-60`}
                    >
                      <BlockBody
                        cell={item.cell}
                        during={isDuring(item.cell)}
                      />
                    </button>
                  ) : (
                    <div
                      data-presence={item.cell.presence ?? "present"}
                      inert={item.cell.presence === "leaving"}
                      style={named(item.cell).style}
                      className={`${blockClass} ${named(item.cell).className}`}
                    >
                      <BlockBody
                        cell={item.cell}
                        during={isDuring(item.cell)}
                      />
                    </div>
                  )}
                  {now && isDuring(item.cell) && (
                    <NowLine.Through
                      label={now.label}
                      at={elapsed(item.cell)}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
          {now &&
            i === nowIndex &&
            !(item.kind === "class" && isDuring(item.cell)) && (
              <NowLine.Agenda label={now.label} />
            )}
        </Fragment>
      ))}
    </div>
  );
}

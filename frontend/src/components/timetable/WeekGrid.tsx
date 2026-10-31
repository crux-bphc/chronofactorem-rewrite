import { formatAxisHour } from "@/utils/timeFormat";
import {
  blockName,
  splitCode,
  type TimetableCell,
  timetableDayNames,
} from "@/utils/timetableGrid";
import { EmptyState, emptyTimetableHint } from "./EmptyState";
import { RemoveButton } from "./RemoveButton";

type WeekGridProps = {
  cells: TimetableCell[];
  dayCount: number;
  hourCount: number;
  mode: "edit" | "view" | "export";
  pending?: boolean;
  onOpen?: (
    cell: TimetableCell,
    event: React.MouseEvent | React.KeyboardEvent,
  ) => void;
  onRemove?: (cell: TimetableCell) => void;
  /** The now-line slot (C5). */
  now?: React.ReactNode;
};

// tiles are size containers: narrow ones (phone) stack dept / number so the
// number never truncates; from 88px wide (tablet) the code fits on one line
const tileClass = "relative z-1 min-w-0 overflow-hidden rounded-sm bg-ev";
const padClass =
  "flex flex-col justify-start px-[7px] pt-1.5 pb-[5px] text-left leading-[1.15]";

/**
 * A grid tile's text. `spacer` floats a box of that size at the top right of
 * the first line so a word that would run under the editor's × wraps below it.
 * `reserve` instead pads the stacked layout's dept line clear of the × and
 * truncates it, so a narrow tile never grows a line.
 */
export function TileBody({
  cell,
  spacer,
  reserve,
}: {
  cell: TimetableCell;
  spacer?: string;
  reserve?: string;
}) {
  const { dept, number } = splitCode(cell.code);
  const float = spacer && (
    <span aria-hidden="true" className={`float-right ${spacer}`} />
  );
  const sub = `${cell.type}${cell.number} · ${cell.room}`;
  return (
    <>
      <span className="contents @min-[88px]:hidden">
        <span
          className={`block text-xs font-medium text-ink-muted ${
            reserve ? `truncate ${reserve}` : spacer ? "" : "truncate"
          }`}
        >
          {!reserve && float}
          {dept}
        </span>
        <span className="block truncate text-base font-semibold">{number}</span>
        <span className="block truncate text-xs text-ink-muted">{sub}</span>
      </span>
      <span className="hidden @min-[88px]:contents">
        <span
          className={`block text-base font-semibold ${spacer ? "" : "truncate"}`}
        >
          {float}
          {cell.code}
        </span>
        <span className="mt-0.5 block truncate text-xs text-ink-muted">
          {sub}
        </span>
      </span>
    </>
  );
}

export function WeekGrid({
  cells,
  dayCount,
  hourCount,
  mode,
  pending,
  onOpen,
  onRemove,
  now,
}: WeekGridProps) {
  return (
    <div
      // rows grow from 48px to 64px on tablets, where the tiles are wide
      className="tt-week relative grid gap-x-[3px] gap-y-1.5 px-2.5 py-1 [--tt-row:48px] sm:[--tt-row:64px]"
      style={{
        gridTemplateColumns: `40px repeat(${dayCount}, minmax(0, 1fr))`,
        gridTemplateRows: `22px repeat(${hourCount}, var(--tt-row))`,
      }}
    >
      {timetableDayNames.slice(0, dayCount).map((name, d) => (
        <div
          key={name}
          className="self-end pb-1 text-center text-xs font-semibold tracking-[.06em] text-ink-muted uppercase"
          style={{ gridColumn: d + 2, gridRow: 1 }}
        >
          {name.slice(0, 3)}
        </div>
      ))}
      {Array.from({ length: hourCount }, (_, h) => (
        <div key={`hour-${h}`} className="contents">
          <div
            aria-hidden="true"
            className="pointer-events-none -mx-px -translate-y-[3.5px] self-start border-gridline border-t"
            style={{ gridColumn: "2 / -1", gridRow: h + 2 }}
          />
          <div
            className="pr-1 text-right text-xs whitespace-nowrap text-ink-faint"
            style={{
              gridColumn: 1,
              gridRow: h + 2,
              transform: "translateY(-9px)",
            }}
          >
            {formatAxisHour(h)}
          </div>
        </div>
      ))}
      {cells.length === 0 && (
        <EmptyState
          hint={emptyTimetableHint(mode)}
          className="z-1 self-center justify-self-center px-4"
          style={{ gridColumn: "2 / -1", gridRow: "2 / -1" }}
        />
      )}
      {cells.map((cell) => {
        const key = `${cell.id}-${cell.day}-${cell.hour}`;
        const leaving = cell.presence === "leaving";
        // live tiles carry their morph name (C7); export and leaving don't
        const named = mode !== "export" && !leaving;
        const placement = {
          gridColumn: cell.day + 2,
          gridRow: `${cell.hour + 2} / span ${cell.span}`,
          ...(named ? { "--vt": blockName(cell) } : {}),
        } as React.CSSProperties;
        const nameClass = named ? "tt-block" : "";
        return mode === "edit" ? (
          // the open button and the × are siblings, never nested
          <div
            key={key}
            style={placement}
            data-presence={cell.presence ?? "present"}
            inert={leaving}
            className={`@container ${tileClass} ${nameClass} hover:bg-ev-hover`}
          >
            <button
              type="button"
              disabled={pending || leaving}
              onClick={leaving ? undefined : (event) => onOpen?.(cell, event)}
              onKeyDown={
                leaving
                  ? undefined
                  : (event) => {
                      if (event.key === "Delete" || event.key === "Backspace") {
                        event.preventDefault();
                        onRemove?.(cell);
                      }
                    }
              }
              aria-label={`Edit ${cell.courseId} ${cell.type}${cell.number}, press Delete to remove`}
              className={`${padClass} size-full cursor-pointer rounded-sm @max-[87px]:px-1.5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-60`}
            >
              <TileBody cell={cell} spacer="h-3 w-3" reserve="pr-2.5" />
            </button>
            {/* the tile is small, so the ×'s hit area stays at 28px rather
            than taking most of it */}
            <RemoveButton
              cell={cell}
              disabled={pending || leaving}
              onRemove={onRemove}
              iconSize={10}
              className="top-[3px] right-px size-3.5 after:size-7"
            />
          </div>
        ) : (
          <div
            key={key}
            style={placement}
            data-presence={cell.presence ?? "present"}
            inert={leaving}
            className={`@container ${tileClass} ${padClass} ${nameClass}`}
          >
            <TileBody cell={cell} />
          </div>
        );
      })}
      {now}
    </div>
  );
}

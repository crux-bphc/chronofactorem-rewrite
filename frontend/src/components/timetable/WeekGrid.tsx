import { Bird } from "lucide-react";
import { formatAxisHour } from "@/utils/timeFormat";
import {
  hourLabelFade,
  splitCode,
  type TimetableCell,
  timetableDayNames,
} from "@/utils/timetableGrid";

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
  /** Now as hours since the first axis hour; hides the hour label it nears. */
  nowAt?: number | null;
};

const tileClass =
  "relative z-1 flex min-w-0 flex-col justify-start overflow-hidden rounded-sm bg-ev px-[7px] pt-1.5 pb-[5px] text-left leading-[1.15]";

export function TileBody({ cell }: { cell: TimetableCell }) {
  const { dept, number } = splitCode(cell.code);
  return (
    <>
      <span className="block truncate text-xs font-medium text-ink-muted">
        {dept}
      </span>
      <span className="block truncate text-base font-semibold">{number}</span>
      <span className="block truncate text-xs text-ink-muted">
        {`${cell.type}${cell.number} · ${cell.room}`}
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
  nowAt = null,
}: WeekGridProps) {
  return (
    <div
      className="tt-week relative grid gap-x-[3px] gap-y-1.5 px-2.5 py-1"
      style={{
        gridTemplateColumns: `40px repeat(${dayCount}, minmax(0, 1fr))`,
        gridTemplateRows: `22px repeat(${hourCount}, 48px)`,
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
            className={`pr-1 text-right text-xs whitespace-nowrap text-ink-faint ${hourLabelFade(h, nowAt)}`}
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
        const placement = {
          gridColumn: cell.day + 2,
          gridRow: `${cell.hour + 2} / span ${cell.span}`,
        };
        const key = `${cell.id}-${cell.day}-${cell.hour}`;
        const leaving = cell.presence === "leaving";
        return mode === "edit" ? (
          <button
            key={key}
            type="button"
            disabled={pending || leaving}
            inert={leaving}
            data-presence={cell.presence ?? "present"}
            style={placement}
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
            className={`${tileClass} cursor-pointer hover:bg-ev-hover focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60`}
          >
            <TileBody cell={cell} />
          </button>
        ) : (
          <div
            key={key}
            style={placement}
            data-presence={cell.presence ?? "present"}
            inert={leaving}
            className={tileClass}
          >
            <TileBody cell={cell} />
          </div>
        );
      })}
      {now}
    </div>
  );
}

import { useIsMutating } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTimetableState } from "@/context";
import {
  buildTimetableGrid,
  type TimetableCell,
  timetableDayNames,
} from "@/utils/timetableGrid";

export function TimetableGrid({
  isVertical,
  handleUnitClick,
  handleUnitDelete,
  isOnEditPage,
}: {
  isVertical: boolean;
  handleUnitClick?: (
    cell: TimetableCell,
    event: React.MouseEvent | React.KeyboardEvent,
  ) => void;
  handleUnitDelete?: (cell: TimetableCell) => void;
  isOnEditPage: boolean;
}) {
  const {
    state: { timetableDetailsSections, timetable },
  } = useTimetableState();
  const pending =
    useIsMutating({ mutationKey: ["sections", timetable?.id] }) > 0;
  const { cells, dayCount, hourCount } = useMemo(
    () => buildTimetableGrid(timetableDetailsSections),
    [timetableDetailsSections],
  );
  const days = Array.from({ length: dayCount }, (_, i) => i);
  const vertical = isVertical;
  const hours = Array.from({ length: hourCount }, (_, i) => i);
  const timeLabel = (hour: number) =>
    `${((hour + 7) % 12) + 1}${hour + 8 < 12 ? "am" : "pm"}`;
  const position = (day: number, hour: number, span = 1) =>
    vertical
      ? {
          gridColumn: days.indexOf(day) + 2,
          gridRow: `${hour + 2} / span ${span}`,
        }
      : {
          gridRow: days.indexOf(day) + 2,
          gridColumn: `${hour + 2} / span ${span}`,
        };

  return (
    <section aria-label="Weekly timetable" className="min-w-0 w-full lg:h-full">
      {/* on large screens the grid fills the page and its auto rows stretch */}
      <div className="overflow-x-auto rounded-xl border bg-card p-2 sm:p-3 lg:flex lg:min-h-full lg:flex-col">
        <div
          className="grid gap-1.5 lg:flex-1"
          style={{
            gridTemplateColumns: vertical
              ? `3rem repeat(${days.length}, minmax(0, 1fr))`
              : `3rem repeat(${hourCount}, minmax(4rem, 1fr))`,
            gridTemplateRows: vertical
              ? `2rem repeat(${hourCount}, minmax(4.5rem, auto))`
              : `2rem repeat(${days.length}, minmax(6rem, auto))`,
          }}
        >
          {days.map((day, i) => (
            <div
              key={day}
              className="flex items-center justify-center text-xs font-semibold text-muted-foreground"
              style={
                vertical
                  ? { gridColumn: i + 2, gridRow: 1 }
                  : { gridColumn: 1, gridRow: i + 2 }
              }
            >
              {timetableDayNames[day].slice(0, 3)}
            </div>
          ))}
          {hours.map((hour) => (
            <div
              key={hour}
              className="flex items-center justify-center text-xs tabular-nums text-muted-foreground"
              style={
                vertical
                  ? { gridColumn: 1, gridRow: hour + 2 }
                  : { gridColumn: hour + 2, gridRow: 1 }
              }
            >
              {timeLabel(hour)}
            </div>
          ))}
          {days.flatMap((day) =>
            hours.map((hour) => (
              <div
                key={`${day}:${hour}`}
                aria-hidden="true"
                style={position(day, hour)}
                className="rounded-md bg-muted/40"
              />
            )),
          )}
          {cells
            .filter((cell) => days.includes(cell.day))
            .map((cell) => (
              <div
                key={`${cell.id}:${cell.day}:${cell.hour}`}
                style={position(cell.day, cell.hour, cell.span)}
                className="relative min-w-0 rounded-lg border bg-muted"
              >
                <Tooltip delayDuration={200}>
                  <TooltipTrigger asChild>
                    {isOnEditPage ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={(event) => handleUnitClick?.(cell, event)}
                        onKeyDown={(event) => {
                          if (
                            event.key === "Delete" ||
                            event.key === "Backspace"
                          ) {
                            event.preventDefault();
                            handleUnitDelete?.(cell);
                          }
                        }}
                        aria-label={`Edit ${cell.courseId} ${cell.type}${cell.number}, press Delete to remove`}
                        className="flex h-full w-full cursor-pointer flex-col justify-center gap-1 rounded-lg p-2 text-left text-xs transition-colors hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60"
                      >
                        <span className="font-semibold break-words">
                          {cell.courseId}
                        </span>
                        <span>
                          {cell.type}
                          {cell.number}
                        </span>
                        <span className="opacity-75 break-words">
                          {cell.room}
                        </span>
                      </button>
                    ) : (
                      <div className="flex h-full flex-col justify-center gap-1 rounded-lg p-2 text-xs focus-visible:outline-2 focus-visible:outline-ring">
                        <span className="font-semibold break-words">
                          {cell.courseId}
                        </span>
                        <span>
                          {cell.type}
                          {cell.number}
                        </span>
                        <span className="opacity-75 break-words">
                          {cell.room}
                        </span>
                      </div>
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{cell.name}</p>
                    <p>{cell.instructors.join(", ")}</p>
                    <p>
                      {timeLabel(cell.hour)} to{" "}
                      {timeLabel(cell.hour + cell.span)}
                    </p>
                    {isOnEditPage && (
                      <p className="text-muted-foreground">
                        (Double tap to remove)
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
                {isOnEditPage && (
                  <button
                    type="button"
                    disabled={pending}
                    aria-label={`Remove ${cell.courseId} ${cell.type}${cell.number}`}
                    onClick={() => handleUnitDelete?.(cell)}
                    className="absolute right-0 bottom-0 hidden sm:flex size-8 cursor-pointer items-center justify-center rounded-lg opacity-70 hover:bg-background/50 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-30"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
        </div>
      </div>
      {timetableDetailsSections.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          {isOnEditPage
            ? "Choose a course to start building your week."
            : "No classes in this timetable."}
        </p>
      )}
    </section>
  );
}

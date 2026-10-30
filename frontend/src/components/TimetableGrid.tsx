import { useIsMutating } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTimetableState } from "@/context";
import { useTimetableNav } from "@/lib/useTimetableNav";
import {
  buildTimetableGrid,
  type TimetableCell,
  timetableDayNames,
  timetableDays,
} from "@/utils/timetableGrid";

export function TimetableGrid({
  isVertical,
  handleUnitClick,
  handleUnitDelete,
  isOnEditPage,
  isExport = false,
  hideControls = false,
}: {
  isVertical: boolean;
  handleUnitClick?: (
    cell: TimetableCell,
    event: React.MouseEvent | React.KeyboardEvent,
  ) => void;
  handleUnitDelete?: (cell: TimetableCell) => void;
  isOnEditPage: boolean;
  isExport?: boolean;
  hideControls?: boolean;
}) {
  const {
    state: { timetableDetailsSections, screenIsLarge, timetable },
  } = useTimetableState();
  const pending =
    useIsMutating({ mutationKey: ["sections", timetable?.id] }) > 0;
  const { cells, dayCount, hourCount } = useMemo(
    () => buildTimetableGrid(timetableDetailsSections),
    [timetableDetailsSections],
  );
  const nav = useTimetableNav();
  // absent params fall back to today and the screen size; exports ignore them
  const selectedDay =
    (isExport ? undefined : nav.search.day) ??
    Math.min(Math.max(new Date().getDay() - 1, 0), 5);
  const showWeek = isExport
    ? true
    : nav.search.view
      ? nav.search.view === "week"
      : !window.matchMedia("(max-width: 639px)").matches;
  // exports always get the full grid, whatever the screen size
  const large = screenIsLarge || isExport;
  const dayView = !large && !showWeek;
  const days = dayView
    ? [Math.min(selectedDay, dayCount - 1)]
    : Array.from({ length: dayCount }, (_, i) => i);
  const vertical = !large || isVertical;
  // the week on small screens scrolls sideways instead of truncating codes.
  // nothing else may scroll: an export would draw the scrollbars into the image
  const scrollsSideways = !large && !dayView;
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
      {!large && !hideControls && (
        <fieldset
          className="flex gap-1 mb-2 rounded-xl bg-muted p-1"
          aria-label="Choose a layout"
        >
          {[false, true].map((week) => (
            <button
              key={week ? "week" : "day"}
              type="button"
              aria-pressed={showWeek === week}
              onClick={() => nav.setView(week ? "week" : "day")}
              className="flex-1 rounded-lg py-2 text-sm font-medium text-muted-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
            >
              {week ? "Week" : "Day"}
            </button>
          ))}
        </fieldset>
      )}
      {dayView && !hideControls && (
        <fieldset
          className="flex gap-1 mb-4 rounded-xl bg-muted p-1"
          aria-label="Choose a day"
        >
          {timetableDays.slice(0, dayCount).map((day, i) => (
            <button
              key={day}
              type="button"
              aria-pressed={days[0] === i}
              aria-label={timetableDayNames[i]}
              onClick={() => nav.setDay(i)}
              className="flex-1 rounded-lg py-2 text-sm font-medium text-muted-foreground aria-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
            >
              {timetableDayNames[i].slice(0, 3)}
            </button>
          ))}
        </fieldset>
      )}
      {/* on large screens the grid fills the page and its auto rows stretch */}
      {/* sizes are in em so text, labels and cells grow together on big
          screens. exports keep one size whatever screen they're made on */}
      <div
        className={`rounded-xl border bg-card p-[0.67em] sm:p-[1em] lg:flex lg:min-h-full lg:flex-col ${
          scrollsSideways ? "overflow-x-auto" : ""
        } ${
          isExport
            ? "text-xs"
            : "text-xs min-[1920px]:text-sm min-[2560px]:text-base min-[3200px]:text-lg"
        }`}
      >
        <div
          className="grid gap-[0.5em] lg:flex-1"
          style={{
            gridTemplateColumns: vertical
              ? `4em repeat(${days.length}, minmax(${scrollsSideways ? "5.33em" : "0"}, 1fr))`
              : `4em repeat(${hourCount}, minmax(5.33em, 1fr))`,
            gridTemplateRows: vertical
              ? `2.67em repeat(${hourCount}, minmax(6em, auto))`
              : `2.67em repeat(${days.length}, minmax(8em, auto))`,
          }}
        >
          {days.map((day, i) => (
            <div
              key={day}
              className="flex items-center justify-center font-semibold text-muted-foreground"
              style={
                vertical
                  ? { gridColumn: i + 2, gridRow: 1 }
                  : { gridColumn: 1, gridRow: i + 2 }
              }
            >
              {dayView
                ? timetableDayNames[day]
                : timetableDayNames[day].slice(0, 3)}
            </div>
          ))}
          {hours.map((hour) => (
            <div
              key={hour}
              className="flex items-center justify-center tabular-nums text-muted-foreground"
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
                        className="flex h-full w-full cursor-pointer flex-col justify-center gap-[0.33em] rounded-lg p-[0.67em] text-left transition-colors hover:bg-foreground/5 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-60"
                      >
                        <span className="font-semibold">
                          {/* in narrow cells whole words drop below the remove button */}
                          <span className="float-right hidden sm:block h-[1em] w-[1.5em]" />
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
                      <div className="flex h-full flex-col justify-center gap-[0.33em] rounded-lg p-[0.67em] focus-visible:outline-2 focus-visible:outline-ring">
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
                    className="absolute top-0 right-0 hidden sm:flex size-[2.67em] cursor-pointer items-center justify-center rounded-lg opacity-70 hover:bg-background/50 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-30"
                  >
                    <X className="size-[1.17em]" />
                  </button>
                )}
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}

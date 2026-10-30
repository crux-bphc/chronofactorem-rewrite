import { X } from "lucide-react";
import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTimetableState } from "@/context";
import { buildTimetableGrid, type TimetableCell } from "@/utils/timetableGrid";

export function TimetableGrid({
  isVertical,
  handleUnitClick,
  handleUnitDelete,
  isOnEditPage,
}: {
  isVertical: boolean;
  handleUnitClick?: (
    e: {
      id: string;
      name: string;
      courseId: string;
      room: string;
      code: string;
      type: string;
      number: number;
      instructors: string[];
    } | null,
    event: React.MouseEvent,
  ) => void;
  handleUnitDelete?: (
    e: {
      id: string;
      name: string;
      courseId: string;
      room: string;
      code: string;
      type: string;
      number: number;
      instructors: string[];
    } | null,
  ) => void;
  isOnEditPage: boolean;
}) {
  const {
    state: { timetableDetailsSections },
  } = useTimetableState();
  const daysOfWeek = ["M", "T", "W", "Th", "F", "S"];
  const timings = [
    "8 - 9",
    "9 - 10",
    "10 - 11",
    "11 - 12",
    "12 - 1",
    "1 - 2",
    "2 - 3",
    "3 - 4",
    "4 - 5",
    "5 - 6",
    "6 - 7",
    "7 - 8",
    "8 - 9",
  ];
  const { grid, spans, skipped, displayRows, displayCols } = useMemo(() => {
    const model = buildTimetableGrid(timetableDetailsSections);
    const grid: (TimetableCell | null)[] = Array(13 * 6).fill(null);
    const spans = new Map<number, number>();
    const skipped = new Set<number>();
    for (const cell of model.cells) {
      const start = isVertical
        ? cell.day + cell.hour * 6
        : cell.hour + cell.day * 13;
      spans.set(start, cell.span);
      for (let offset = 0; offset < cell.span; offset++) {
        const index = start + offset * (isVertical ? 6 : 1);
        grid[index] = cell;
        if (offset) skipped.add(index);
      }
    }
    return {
      grid,
      spans,
      skipped,
      displayRows: model.dayCount,
      displayCols: model.hourCount,
    };
  }, [timetableDetailsSections, isVertical]);

  return (
    <div className="flex w-full lg:h-full h-[150%]">
      {isVertical ? (
        <div
          style={{ gridTemplateRows: `repeat(${displayCols}, minmax(0, 1fr))` }}
          className={`pt-16 gap-9 sm:gap-8 sm:mt-4 lg:pt-8 lg:gap-2 sm:h-full grid justify-between  md:text-md text-sm text-center text-foreground/80 font-bold`}
        >
          {timings
            .filter((_, i) => i < displayCols)
            .map((e) => (
              <div className="whitespace-nowrap mr-4" key={e}>
                <span>{e}</span>
              </div>
            ))}
        </div>
      ) : (
        <div
          style={{ gridTemplateRows: `repeat(${displayRows}, minmax(0, 1fr))` }}
          className={`grid  items-center mr-4 mt-12 md:text-lg text-md text-center font-bold text-foreground/80`}
        >
          {daysOfWeek.slice(0, displayRows).map((e) => (
            <span key={e}>{e}</span>
          ))}
        </div>
      )}
      <div className="flex flex-col w-full h-full">
        {isVertical ? (
          <div
            style={{
              gridTemplateColumns: `repeat(${displayRows}, minmax(0, 1fr))`,
            }}
            className={`grid  items-center pr-2 md:text-lg text-md text-center font-bold text-foreground/80 `}
          >
            {daysOfWeek.slice(0, displayRows).map((e) => (
              <span key={e}>{e}</span>
            ))}
          </div>
        ) : (
          <div
            style={{
              gridTemplateColumns: `repeat(${displayCols}, minmax(0, 1fr))`,
            }}
            className={`grid  justify-between md:text-md text-sm text-center font-bold text-foreground/80`}
          >
            {timings
              .filter((_, i) => i < displayCols)
              .map((e) => (
                <div className="mb-4 flex flex-col" key={e}>
                  <span>{e}</span>
                </div>
              ))}
          </div>
        )}
        <div
          className="grid w-full h-full"
          style={{
            gridTemplateColumns: `repeat(${isVertical ? displayRows : displayCols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${isVertical ? displayCols : displayRows}, minmax(0, 1fr))`,
          }}
        >
          {grid
            .map((e, i) => ({ e, i }))
            .filter(
              ({ i }) =>
                !skipped.has(i) &&
                (isVertical
                  ? i < 6 * displayCols && i % 6 < displayRows
                  : i % 13 < displayCols && i < 13 * displayRows),
            )
            .map(({ e, i }) => {
              if (e === null) {
                return (
                  <div
                    className={`bg-background border border-muted dark:border-muted/70 ${
                      isVertical ? "min-h-28 sm:min-h-16" : "min-h-20"
                    }`}
                    key={2 * i}
                  />
                );
              }
              const span = spans.get(i) ?? 1;
              return (
                <Tooltip delayDuration={100} key={`${e.id}-${i}`}>
                  <TooltipTrigger asChild>
                    {/* TODO: Deal with this lint error */}
                    {/* biome-ignore lint/a11y/useKeyWithClickEvents: need to check if button works styling wise */}
                    {/** biome-ignore lint/a11y/noStaticElementInteractions: need to check if button works styling wise */}
                    <div
                      className={`bg-background border border-muted dark:border-muted/70 transition duration-200 ease-in-out text-foreground/65 p-1.5 ${
                        isOnEditPage ? "cursor-pointer" : ""
                      } ${isVertical ? "min-h-28 sm:min-h-16" : "min-h-20"}`}
                      style={
                        span > 1
                          ? isVertical
                            ? { gridRow: `span ${span}` }
                            : { gridColumn: `span ${span}` }
                          : undefined
                      }
                      onClick={(event) => handleUnitClick?.(e, event)}
                    >
                      <div className="relative flex h-full text-xs sm:text-sm flex-col justify-end bg-muted-foreground/30 p-1.5 rounded gap-0.5">
                        <X
                          size={16}
                          className={`absolute top-1 right-1 cursor-pointer sm:visible invisible hover:stroke-destructive dark:hover:stroke-red-400 transition duration-100 ease-in-out ${
                            isOnEditPage ? "" : "hidden"
                          }`}
                          onClick={() => handleUnitDelete?.(e)}
                        />
                        <span className="font-bold text-ellipsis overflow-hidden text-wrap tracking-tight">
                          {e.courseId}
                        </span>
                        <div
                          className={`flex justify-between ${
                            isVertical ? "flex-col sm:flex-row" : "flex-row"
                          }`}
                        >
                          <span className="font-bold">
                            {e.type}
                            {e.number}
                          </span>
                          <span className="opacity-90 text-start">
                            {e.room}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-primary-foreground text-center text-foreground">
                    {e.name}
                    {isOnEditPage && (
                      <>
                        <br />
                        <span className="text-muted-foreground">
                          (Double tap to remove)
                        </span>
                      </>
                    )}
                  </TooltipContent>
                </Tooltip>
              );
            })}
        </div>
      </div>
    </div>
  );
}

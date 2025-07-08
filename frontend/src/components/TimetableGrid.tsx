import { X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function TimetableGrid({
  isVertical,
  timetableDetailsSections,
  handleUnitClick,
  handleUnitDelete,
  isOnEditPage,
}: {
  isVertical: boolean;
  timetableDetailsSections: {
    id: string;
    name: string;
    roomTime: string[];
    courseId: string;
    type: string;
    number: number;
    instructors: string[];
  }[];
  handleUnitClick: (
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
  handleUnitDelete: (
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
  const displayRows = 6;
  const [displayCols, setDisplayCols] = useState(13);

  const timetableGrid = useMemo(() => {
    const grid: ({
      id: string;
      name: string;
      courseId: string;
      room: string;
      code: string;
      type: string;
      number: number;
      instructors: string[];
    } | null)[] = Array(13 * 6);
    for (let i = 0; i < grid.length; i++) {
      grid[i] = null;
    }
    for (let i = 0; i < timetableDetailsSections.length; i++) {
      for (let j = 0; j < timetableDetailsSections[i].roomTime.length; j++) {
        const [code, room, day, hour] =
          timetableDetailsSections[i].roomTime[j].split(":");
        const remainder = daysOfWeek.indexOf(day);
        const quotient = Number.parseInt(hour) - 1;
        grid[
          isVertical ? remainder + quotient * 6 : quotient + remainder * 13
        ] = {
          id: timetableDetailsSections[i].id,
          courseId: timetableDetailsSections[i].courseId,
          room: room,
          code: code,
          type: timetableDetailsSections[i].type,
          number: timetableDetailsSections[i].number,
          instructors: timetableDetailsSections[i].instructors,
          name: timetableDetailsSections[i].name,
        };
      }
    }

    const minDisplayCols = 9;
    let nonNullColumns = 13;
    for (let j = 12; j >= minDisplayCols; j--) {
      let flag = true;
      for (let i = 0; i < 6; i++) {
        if ((isVertical ? grid[j * 6 + i] : grid[i * 13 + j]) !== null) {
          flag = false;
          break;
        }
      }
      if (flag) {
        nonNullColumns = j;
      } else {
        break;
      }
    }
    setDisplayCols(nonNullColumns);

    return grid;
  }, [timetableDetailsSections, isVertical]);

  return (
    <div className="flex w-full lg:h-full h-[150%]">
      {isVertical ? (
        <div
          className={`pt-16 gap-9 sm:gap-8 sm:mt-4 lg:pt-8 lg:gap-2 sm:h-full grid justify-between grid-rows-${displayCols} md:text-md text-sm text-center text-foreground/80 font-bold`}
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
          className={`grid grid-rows-${displayRows} items-center mr-4 mt-12 md:text-lg text-md text-center font-bold text-foreground/80`}
        >
          {daysOfWeek.map((e) => (
            <span key={e}>{e}</span>
          ))}
        </div>
      )}
      <div className="flex flex-col w-full h-full">
        {isVertical ? (
          <div
            className={`grid grid-cols-${displayRows} items-center pr-2 md:text-lg text-md text-center font-bold text-foreground/80 `}
          >
            {daysOfWeek.map((e) => (
              <span key={e}>{e}</span>
            ))}
          </div>
        ) : (
          <div
            className={`grid grid-cols-${displayCols} justify-between md:text-md text-sm text-center font-bold text-foreground/80`}
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
          className={`grid w-full h-full ${
            isVertical
              ? `grid-cols-${displayRows} grid-rows-${displayCols}`
              : `grid-cols-${displayCols} grid-rows-${displayRows}`
          }`}
        >
          {timetableGrid
            .filter((_, i) =>
              isVertical ? i < 6 * displayCols : i % 13 < displayCols,
            )
            .map((e, i) =>
              e !== null ? (
                <Tooltip delayDuration={100} key={`${e.id}-${i}`}>
                  <TooltipTrigger asChild>
                    {/* TODO: Deal with this lint error */}
                    {/* biome-ignore lint/a11y/useKeyWithClickEvents: need to check if button works styling wise */}
                    {/** biome-ignore lint/a11y/noStaticElementInteractions: need to check if button works styling wise */}
                    <div
                      className={`bg-background border border-muted dark:border-muted/70 cursor-pointer transition duration-200 ease-in-out text-foreground/65 p-1.5 ${
                        isVertical ? "min-h-28 sm:min-h-16" : "min-h-20"
                      }`}
                      onClick={(event) => handleUnitClick(e, event)}
                    >
                      <div className="relative flex h-full text-xs sm:text-sm flex-col justify-end bg-muted-foreground/30 p-1.5 rounded gap-0.5">
                        <X
                          size={16}
                          className={`absolute top-1 right-1 sm:visible invisible hover:stroke-destructive dark:hover:stroke-red-400 transition duration-100 ease-in-out ${
                            isOnEditPage ? "" : "hidden"
                          }`}
                          onClick={() => handleUnitDelete(e)}
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
              ) : (
                <div
                  className={`bg-background border border-muted dark:border-muted/70 ${
                    isVertical ? "min-h-28 sm:min-h-16" : "min-h-20"
                  }`}
                  // biome-ignore lint/suspicious/noArrayIndexKey: there's literally no other property this grid thing has
                  key={2 * i}
                />
              ),
            )}
          {/* {JSON.stringify(timetableDetails)} */}
        </div>
      </div>
    </div>
  );
}

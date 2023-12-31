import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { X } from "lucide-react";
import { useMemo } from "react";

export function TimetableGrid({
  isVertical,
  timetableDetailsSections,
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
  ];

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
    } | null)[] = Array(11 * 6);
    for (let i = 0; i < grid.length; i++) {
      grid[i] = null;
    }
    for (let i = 0; i < timetableDetailsSections.length; i++) {
      for (let j = 0; j < timetableDetailsSections[i].roomTime.length; j++) {
        const [code, room, day, hour] =
          timetableDetailsSections[i].roomTime[j].split(":");
        const remainder = daysOfWeek.indexOf(day);
        const quotient = parseInt(hour) - 1;
        grid[
          isVertical ? remainder + quotient * 6 : quotient + remainder * 11
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

    return grid;
  }, [timetableDetailsSections, isVertical]);

  return (
    <div className="ml-4 flex w-full">
      {isVertical ? (
        <div />
      ) : (
        <div
          className={`grid items-center pr-2 text-lg text-center font-bold ${
            isVertical ? "grid-cols-6" : "grid-rows-6 mt-12"
          }`}
        >
          {daysOfWeek.map((e) => (
            <span key={e}>{e}</span>
          ))}
        </div>
      )}
      <div className="flex flex-col w-full">
        {isVertical ? (
          <div
            className={`grid items-center pr-2 text-lg text-center font-bold ${
              isVertical ? "grid-cols-6" : "grid-rows-6 mt-12"
            }`}
          >
            {daysOfWeek.map((e) => (
              <span key={e}>{e}</span>
            ))}
          </div>
        ) : (
          <div
            className={`grid justify-between text-md text-center text-slate-500 ${
              isVertical ? "grid-rows-11" : "grid-cols-11"
            } `}
          >
            {timings.map((e) => (
              <div className="mb-4 flex flex-col" key={e}>
                <span className="text-slate-600">{e}</span>
              </div>
            ))}
          </div>
        )}
        <div
          className={`grid w-full ${
            isVertical ? "grid-cols-6 grid-rows-11" : "grid-cols-11 grid-rows-6"
          }`}
        >
          {timetableGrid.map((e, i) =>
            e !== null ? (
              <Tooltip delayDuration={100} key={2 * i}>
                <TooltipTrigger asChild>
                  {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
                  <div
                    className={`bg-slate-900 border cursor-pointer transition duration-200 ease-in-out p-1.5 ${
                      isVertical ? "" : "min-h-20"
                    }`}
                    onClick={() => {
                      console.log(e);
                    }}
                  >
                    <div
                      className={`relative flex h-full text-xs sm:text-sm flex-col justify-end bg-slate-600 p-1.5 rounded gap-0.5 ${
                        isVertical ? "" : ""
                      }`}
                    >
                      <X
                        size={16}
                        className="absolute top-1 right-1 sm:visible invisible hover:stroke-[#EF4444]"
                      />
                      <span className="font-bold text-ellipsis overflow-hidden text-wrap tracking-tight">
                        {e.courseId}
                      </span>
                      <div
                        className={`flex flex-row justify-between ${
                          isVertical ? "flex-col sm:flex-row" : ""
                        }`}
                      >
                        <span className="font-bold">
                          {e.type}
                          {e.number}
                        </span>
                        <span
                          className={`text-slate-300 text-start ${
                            isVertical ? "" : ""
                          }`}
                        >
                          {e.room}
                        </span>
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-slate-900 text-slate-50 border-slate-800">
                  Double click to remove section
                </TooltipContent>
              </Tooltip>
            ) : (
              <div
                className={`bg-slate-900 border ${
                  isVertical ? "" : "min-h-20"
                }`}
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

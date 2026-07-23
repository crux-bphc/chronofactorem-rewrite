import { AlertTriangle, ArrowUpRightFromCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TimetableActionType, useTimetableState } from "@/context";

export const TimetableWarningsTooltip = () => {
  const {
    state: { courses, timetable },
    dispatch,
  } = useTimetableState();

  if (
    courses === undefined ||
    timetable === undefined ||
    timetable.warnings.length === 0
  ) {
    return null;
  }

  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger
        asChild
        className="duration-200 mr-4 text-md p-2 h-fit dark:dark:hover:bg-orange-800/40 hover:bg-orange-300/40 rounded-lg px-4"
      >
        <div className="flex items-center">
          <span className="text-orange-600 dark:text-orange-400 pr-4">
            {timetable.warnings
              .slice(0, 2)
              .map((x) => x.replace(":", " "))
              .map((x, i) => (
                <div key={x}>
                  <span className="font-bold">{x}</span>
                  {i >= 0 && i < timetable.warnings.length - 1 && (
                    <span>, </span>
                  )}
                </div>
              ))}
            {timetable.warnings.length > 2 &&
              ` and ${timetable.warnings.length - 2} other warning${
                timetable.warnings.length > 3 ? "s" : ""
              }`}
          </span>
          <AlertTriangle className="w-6 h-6 m-1 text-orange-600 dark:text-orange-400" />
        </div>
      </TooltipTrigger>
      <TooltipContent className="bg-muted text-foreground border-muted-foreground/40 text-md">
        {timetable.warnings.map((warning) => (
          <div className="pb-2" key={warning}>
            <span className="font-bold">{warning.split(":")[0]} is</span>
            <div className="flex flex-col pl-4">
              {warning
                .split(":")[1]
                .split("")
                .map((x) => (
                  <div className="flex items-center" key={x}>
                    <span>missing a {x} section</span>
                    <Button
                      onClick={() => {
                        dispatch({
                          type: TimetableActionType.SetSelectedCourseAndSection,
                          courseID: courses.filter(
                            (x) => x.code === warning.split(":")[0],
                          )[0].id,
                          sectionType: x as "L" | "P" | "T",
                        });
                      }}
                      className="p-2 w-fit h-fit ml-2 mb-1 bg-transparent hover:bg-slate-300 dark:hover:bg-muted-foreground/30 text-secondary-foreground rounded-full"
                    >
                      <ArrowUpRightFromCircle className="w-4 h-4 text-foreground" />
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </TooltipContent>
    </Tooltip>
  );
};

export default TimetableWarningsTooltip;

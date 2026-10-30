import { AlertTriangle, ArrowUpRight } from "lucide-react";
import { TimetableActionType, useTimetableState } from "@/context";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export const TimetableWarningsTooltip = () => {
  const {
    state: { courses, timetable },
    dispatch,
  } = useTimetableState();
  if (!courses || !timetable?.warnings.length) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 text-amber-700 dark:text-amber-300"
        >
          <AlertTriangle className="size-4" />
          {timetable.warnings.length} incomplete
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-h-80 overflow-y-auto text-sm">
        <p className="mb-3 font-semibold">Complete these sections to publish</p>
        {timetable.warnings.map((warning) => {
          const [code, missing] = warning.split(":");
          const course = courses.find((item) => item.code === code);
          return (
            <div key={warning} className="mb-3">
              <p className="font-medium">{code}</p>
              {(missing ?? "").split("").map((type) => (
                <Button
                  key={type}
                  variant="ghost"
                  disabled={!course}
                  className="h-auto w-full justify-between whitespace-normal px-0 text-left"
                  onClick={() => {
                    if (course)
                      dispatch({
                        type: TimetableActionType.SetSelectedCourseAndSection,
                        courseID: course.id,
                        sectionType: type as "L" | "P" | "T",
                      });
                  }}
                >
                  Add{" "}
                  {type === "L"
                    ? "lecture"
                    : type === "T"
                      ? "tutorial"
                      : "practical"}
                  <ArrowUpRight className="size-4" />
                </Button>
              ))}
            </div>
          );
        })}
      </PopoverContent>
    </Popover>
  );
};
export default TimetableWarningsTooltip;

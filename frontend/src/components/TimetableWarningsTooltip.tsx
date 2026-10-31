import { AlertTriangle, ArrowUpRightFromCircle } from "lucide-react";
import { useState } from "react";
import BottomSheet, {
  BottomSheetList,
  BottomSheetRow,
} from "@/components/BottomSheet";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTimetableState } from "@/context";
import { useTimetableNav } from "@/lib/useTimetableNav";

export const TimetableWarningsTooltip = () => {
  const {
    state: { courses, timetable, screenIsLarge },
  } = useTimetableState();
  const { openCourse } = useTimetableNav();
  const [open, setOpen] = useState(false);

  if (
    courses === undefined ||
    timetable === undefined ||
    timetable.warnings.length === 0
  ) {
    return null;
  }

  const missingSections = timetable.warnings.flatMap((warning) => {
    const [code, types] = warning.split(":");
    const course = courses.find((x) => x.code === code);
    return types.split("").map((type) => ({ warning, code, type, course }));
  });

  const goToSection = (courseID: string, type: string) => {
    setOpen(false);
    openCourse(courseID, type as "L" | "P" | "T");
  };

  const trigger = (
    <button
      type="button"
      aria-label={`${timetable.warnings.length} timetable warning${
        timetable.warnings.length > 1 ? "s" : ""
      }`}
      className="flex items-center text-left duration-200 mr-4 text-md p-2 h-fit dark:dark:hover:bg-orange-800/40 hover:bg-orange-300/40 rounded-lg px-4 max-sm:mr-0 max-sm:h-9 max-sm:gap-1.5 max-sm:rounded-full max-sm:bg-orange-100 max-sm:px-3 max-sm:py-0 max-sm:text-sm max-sm:font-semibold max-sm:text-orange-700 max-sm:hover:bg-orange-200 dark:max-sm:bg-orange-950/60 dark:max-sm:text-orange-300 dark:max-sm:hover:bg-orange-900/60"
    >
      <span className="text-orange-600 dark:text-orange-400 pr-4 max-sm:hidden">
        {timetable.warnings
          .slice(0, 2)
          .map((x) => x.replace(":", " "))
          .map((x, i) => (
            <div key={x}>
              <span className="font-bold">{x}</span>
              {i >= 0 && i < timetable.warnings.length - 1 && <span>, </span>}
            </div>
          ))}
        {timetable.warnings.length > 2 &&
          ` and ${timetable.warnings.length - 2} other warning${
            timetable.warnings.length > 3 ? "s" : ""
          }`}
      </span>
      <AlertTriangle className="size-4 sm:hidden" />
      <span className="sm:hidden">
        {timetable.warnings.length} warning
        {timetable.warnings.length > 1 ? "s" : ""}
      </span>
      <AlertTriangle className="w-6 h-6 m-1 text-orange-600 dark:text-orange-400 max-sm:hidden" />
    </button>
  );

  if (!screenIsLarge) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        icon={
          <AlertTriangle className="size-5 text-orange-600 dark:text-orange-400" />
        }
        title="Timetable warnings"
        description="Sections you still need to add before publishing."
        className="max-h-[65dvh]"
        trigger={trigger}
      >
        <BottomSheetList>
          {missingSections.map(({ code, type, course }) => (
            <BottomSheetRow
              key={code + type}
              disabled={course === undefined}
              onClick={() => course && goToSection(course.id, type)}
            >
              {course ? `${code}: ${course.name}` : code}
              <span className="block font-normal text-muted-foreground">
                missing a {type} section
              </span>
            </BottomSheetRow>
          ))}
        </BottomSheetList>
      </BottomSheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-auto px-3 py-1.5 bg-muted text-foreground border-muted-foreground/40 text-md">
        {timetable.warnings.map((warning) => (
          <div className="pb-2" key={warning}>
            <span className="font-bold">{warning.split(":")[0]} is</span>
            <div className="flex flex-col pl-4">
              {missingSections
                .filter((x) => x.warning === warning)
                .map(({ code, type, course }) => (
                  <div className="flex items-center" key={type}>
                    <span>missing a {type} section</span>
                    <Button
                      aria-label={`Go to ${code} ${type} sections`}
                      disabled={course === undefined}
                      onClick={() => course && goToSection(course.id, type)}
                      className="p-2 w-fit h-fit ml-2 mb-1 bg-transparent hover:bg-slate-300 dark:hover:bg-muted-foreground/30 text-secondary-foreground rounded-full"
                    >
                      <ArrowUpRightFromCircle className="w-4 h-4 text-foreground" />
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default TimetableWarningsTooltip;

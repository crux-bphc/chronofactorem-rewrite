import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import BottomSheet from "@/components/BottomSheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { WarningsList } from "@/components/WarningsList";
import { useTimetableState } from "@/context";

export const TimetableWarningsTooltip = () => {
  const {
    state: { courses, timetable, screenIsLarge },
  } = useTimetableState();
  const [open, setOpen] = useState(false);

  if (
    courses === undefined ||
    timetable === undefined ||
    timetable.warnings.length === 0
  ) {
    return null;
  }

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
        <WarningsList only="sections" onNavigate={() => setOpen(false)} />
      </BottomSheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80 p-3">
        <WarningsList only="sections" onNavigate={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};

export default TimetableWarningsTooltip;

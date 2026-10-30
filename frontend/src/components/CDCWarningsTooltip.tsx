import { AlertOctagon, ArrowUpRightFromCircle } from "lucide-react";
import { useMemo, useState } from "react";
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
import { TimetableActionType, useTimetableState } from "@/context";

export const CDCWarningsTooltip = () => {
  const {
    state: { cdcs, coursesInTimetable, screenIsLarge },
    dispatch,
  } = useTimetableState();
  const [open, setOpen] = useState(false);

  const cdcNotFoundWarning = useMemo(
    () =>
      cdcs.filter((e) => e.id === null && e.type === "warning") as {
        id: null;
        type: "warning";
        warning: string;
      }[],
    [cdcs],
  );

  const missingCDCs = useMemo(() => {
    const missing: {
      id: string;
      code: string;
      name: string;
    }[] = [];
    for (let i = 0; i < cdcs.length; i++) {
      if (cdcs[i].id === null) {
        const option = cdcs[i] as
          | {
              id: null;
              type: "warning";
              warning: string;
            }
          | {
              id: null;
              type: "optional";
              options: {
                id: string;
                code: string;
                name: string;
              }[];
            };
        if (
          option.type === "optional" &&
          !option.options.some((e) =>
            coursesInTimetable
              .map((added) => added.id)
              .includes(e.id as string),
          )
        ) {
          const splitCodes = option.options.map((e) => e.code).join(" (or) ");
          missing.push({
            id: "",
            code: splitCodes,
            name: "",
          });
        }
      } else {
        if (
          !coursesInTimetable.map((e) => e.id).includes(cdcs[i].id as string)
        ) {
          missing.push(
            cdcs[i] as {
              id: string;
              code: string;
              name: string;
            },
          );
        }
      }
    }
    return missing;
  }, [coursesInTimetable, cdcs]);

  const handleMissingCDCClick = (courseId: string) => {
    dispatch({
      type: TimetableActionType.SetMenuTab,
      tab: "CDCs",
    });
    dispatch({
      type: TimetableActionType.SetSelectedCourseAndSection,
      courseID: courseId === "" ? null : courseId,
      sectionType: null,
    });
    // optional CDCs have no single course to open, so show the CDCs tab
    if (!screenIsLarge)
      dispatch({ type: TimetableActionType.SetSidebarOpen, open: true });
    setOpen(false);
  };

  if (missingCDCs.length === 0 && cdcNotFoundWarning.length === 0) return null;

  const trigger = (
    <button
      type="button"
      aria-label="Missing CDCs"
      className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground transition duration-200 ease-in-out max-sm:flex max-sm:h-9 max-sm:items-center max-sm:gap-1.5 max-sm:border max-sm:bg-background max-sm:px-3 max-sm:py-0 max-sm:text-sm max-sm:font-semibold"
    >
      <AlertOctagon className="w-5 h-5 md:w-6 md:h-6 m-1 max-sm:m-0 max-sm:size-4" />
      <span className="sm:hidden">
        {missingCDCs.length > 0
          ? `${missingCDCs.length} missing CDC${missingCDCs.length > 1 ? "s" : ""}`
          : "CDCs not found"}
      </span>
    </button>
  );

  const reportLink = (
    <a
      href="https://github.com/crux-bphc/chronofactorem-rewrite/issues"
      className="text-blue-700 dark:text-blue-400 flex pl-1"
    >
      <span className="text-blue-700 dark:text-blue-400">
        report this issue
      </span>
      <ArrowUpRightFromCircle className="w-4 h-4 ml-1" />
    </a>
  );

  if (!screenIsLarge) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        icon={<AlertOctagon className="size-5" />}
        title="Missing CDCs"
        description="CDCs for this semester that are not in your timetable."
        className="max-h-[65dvh]"
        trigger={trigger}
      >
        <BottomSheetList>
          {missingCDCs.map((e) => (
            <BottomSheetRow
              key={e.id + e.code}
              onClick={() => handleMissingCDCClick(e.id)}
            >
              {e.name ? `${e.code}: ${e.name}` : e.code}
            </BottomSheetRow>
          ))}
          {cdcNotFoundWarning.length > 0 && (
            <div className="flex flex-col gap-1 border-t-2 border-slate-300 px-4 py-3 text-sm dark:border-slate-600">
              <span className="font-bold">
                Chrono could not find some of your CDCs in the list of courses.
              </span>
              <span className="flex">Please{reportLink}</span>
              {cdcNotFoundWarning.map((e) => (
                <span className="text-muted-foreground" key={e.warning}>
                  {e.warning}
                </span>
              ))}
            </div>
          )}
        </BottomSheetList>
      </BottomSheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-auto px-3 py-1.5 bg-muted text-foreground border-muted-foreground/40 text-md">
        {missingCDCs.length > 0 && (
          <div className="flex flex-col">
            <span>
              You haven't added all CDCs for this semester to your timetable.
            </span>
            <span className="font-bold pt-2">CDCs missing:</span>
            {missingCDCs.map((e) => (
              <div className="flex items-center" key={e.id}>
                <span className="ml-2">{e.code}</span>
                <Button
                  onClick={() => {
                    handleMissingCDCClick(e.id);
                  }}
                  className="p-2 w-fit h-fit ml-2 mb-1 bg-transparent hover:bg-slate-300 dark:hover:bg-slate-700 text-secondary-foreground rounded-full"
                >
                  <ArrowUpRightFromCircle className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        {cdcNotFoundWarning.length > 0 && (
          <div className="flex flex-col">
            <span className="font-bold">
              Chrono could not find some of your CDCs in the list of courses.
            </span>
            <span className="flex">
              Please
              <a
                href="https://github.com/crux-bphc/chronofactorem-rewrite/issues"
                className="text-blue-700 dark:text-blue-400 flex pl-1"
              >
                <span className="text-blue-700 dark:text-blue-400">
                  report this issue
                </span>
                <ArrowUpRightFromCircle className="w-4 h-4 ml-1" />
              </a>
            </span>
            <span className="font-bold pt-2">Error List:</span>

            {cdcNotFoundWarning.map((e) => (
              <span className="ml-2" key={e.id}>
                {e.warning}
              </span>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default CDCWarningsTooltip;

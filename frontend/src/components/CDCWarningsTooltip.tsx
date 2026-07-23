import { AlertOctagon, ArrowUpRightFromCircle } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TimetableActionType, useTimetableState } from "@/context";

export const CDCWarningsTooltip = () => {
  const {
    state: { cdcs, coursesInTimetable },
    dispatch,
  } = useTimetableState();

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
  };

  if (missingCDCs.length === 0 && cdcNotFoundWarning.length === 0) return null;

  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger
        asChild
        className="hover:bg-accent hover:text-accent-foreground transition duration-200 ease-in-out"
      >
        <div className="p-2 rounded-full">
          <AlertOctagon className="w-5 h-5 md:w-6 md:h-6 m-1" />
        </div>
      </TooltipTrigger>
      <TooltipContent className="bg-muted text-foreground border-muted-foreground/40 text-md">
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
      </TooltipContent>
    </Tooltip>
  );
};

export default CDCWarningsTooltip;

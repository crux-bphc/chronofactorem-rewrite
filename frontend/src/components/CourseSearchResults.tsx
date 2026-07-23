import { Bird, ChevronRight, HelpCircle } from "lucide-react";
import { useMemo } from "react";
import { TimetableActionType, useTimetableState } from "@/context";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export const CourseSearchResults = ({
  debouncedSearchTerm,
}: {
  debouncedSearchTerm: string;
}) => {
  const {
    state: { courses, timetable },
    dispatch,
  } = useTimetableState();

  const courseSearchResults = useMemo(() => {
    if (courses === undefined || timetable === undefined) return [];
    return (
      debouncedSearchTerm === ""
        ? courses
        : courses.filter((e) =>
            `${e.code}: ${e.name}`
              .toLowerCase()
              .includes(debouncedSearchTerm.toLowerCase()),
          )
    ).map((e) => {
      const withClash = e as unknown as {
        id: string;
        code: string;
        name: string;
        midsemStartTime: string | null;
        midsemEndTime: string | null;
        compreStartTime: string | null;
        compreEndTime: string | null;
        clashing: null | string[];
      };
      if (e.midsemStartTime === null && e.compreStartTime === null) {
        withClash.clashing = null;
        return withClash;
      }
      if (e.midsemStartTime === null && e.compreStartTime !== null) {
        const clashes = timetable.examTimes.filter((x) => {
          if (x.split("|")[0] === e.code) return false;
          return x.includes(
            `${withClash.compreStartTime}|${withClash.compreEndTime}`,
          );
        });
        withClash.clashing = clashes.length === 0 ? null : clashes;
        return withClash;
      }
      if (e.midsemStartTime !== null && e.compreStartTime === null) {
        const clashes = timetable.examTimes.filter((x) => {
          if (x.split("|")[0] === e.code) return false;
          return x.includes(
            `${withClash.midsemStartTime}|${withClash.midsemEndTime}`,
          );
        });
        withClash.clashing = clashes.length === 0 ? null : clashes;
        return withClash;
      }
      const clashes = timetable.examTimes.filter((x) => {
        if (x.split("|")[0] === e.code) return false;
        return (
          x.includes(
            `${withClash.midsemStartTime}|${withClash.midsemEndTime}`,
          ) ||
          x.includes(`${withClash.compreStartTime}|${withClash.compreEndTime}`)
        );
      });
      withClash.clashing = clashes.length === 0 ? null : clashes;
      return withClash;
    });
  }, [courses, debouncedSearchTerm, timetable]);

  return (
    <div className="h-[calc(100%-3rem)] overflow-y-scroll">
      {courseSearchResults.map((course) => (
        // TODO - deal with this biome rule
        // biome-ignore lint/a11y/useKeyWithClickEvents: bro come on really
        // biome-ignore lint/a11y/noStaticElementInteractions: bro come on really
        <div
          onClick={() => {
            if (!course.clashing) {
              dispatch({
                type: TimetableActionType.SetSelectedCourseAndSection,
                courseID: course.id,
                sectionType: null,
              });
            }
          }}
          key={course.id}
          className={`relative px-4 transition flex-col pt-4 flex duration-200 ease-in-out border-t-2 border-muted-foreground/20 ${
            course.clashing
              ? "text-muted-foreground"
              : "cursor-pointer bg-secondary dark:hover:bg-slate-700 hover:bg-slate-200"
          }`}
        >
          {course.clashing && (
            <div className="absolute left-0 top-8 py-1 dark:bg-slate-700/80 bg-slate-300/80 text-secondary-foreground text-center w-full">
              <span className="font-medium text-md">
                Clashing with{" "}
                {course.clashing
                  .map((x) => {
                    const [code, exam] = x.split("|");
                    return `${code}'s ${exam.toLowerCase()}`;
                  })
                  .join(", ")}
              </span>
            </div>
          )}

          <div className="w-full flex justify-between items-center">
            <span className="w-fit text-sm">
              {course.code}: {course.name}
            </span>
            <ChevronRight className="w-6 h-6" />
          </div>

          <div>
            <span className="pl-4 py-1 text-sm font-bold">Midsem</span>
            <span className="pl-4 py-1 text-sm">
              {`${
                course.midsemStartTime
                  ? new Date(course.midsemStartTime).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                      },
                    )
                  : "N/A"
              } — ${
                course.midsemEndTime
                  ? new Date(course.midsemEndTime).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    })
                  : "N/A"
              }`}
              {course.midsemStartTime === null && (
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div className="inline bg-transparent w-fit rounded-full dark:hover:bg-slate-800/80 text-secondary-foreground hover:bg-slate-300/80 p-1 transition duration-200 ease-in-out ml-2 text-sm font-bold">
                      <HelpCircle className="inline h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="w-96 bg-secondary text-secondary-foreground border-slate-300 dark:border-slate-600 text-md">
                    Timetable Division hasn't published the midsem dates for
                    this course. Either there is no midsem exam, or they haven't
                    decided it yet. We recommend checking with your professor.
                  </TooltipContent>
                </Tooltip>
              )}
            </span>
          </div>
          <div className="pb-4">
            <span className="pl-4 py-1 text-sm font-bold">Compre</span>
            <span className="pl-4 py-1 text-sm">
              {`${
                course.compreStartTime
                  ? new Date(course.compreStartTime).toLocaleDateString(
                      "en-US",
                      {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                      },
                    )
                  : "N/A"
              } — ${
                course.compreEndTime
                  ? new Date(course.compreEndTime).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    })
                  : "N/A"
              }`}
              {course.compreStartTime === null && (
                <Tooltip delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div className="inline bg-transparent w-fit rounded-full dark:hover:bg-slate-800/80 text-secondary-foreground hover:bg-slate-300/80 p-1 transition duration-200 ease-in-out ml-2 text-sm font-bold">
                      <HelpCircle className="inline h-4 w-4" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="w-96 bg-secondary text-secondary-foreground border-slate-300 dark:border-slate-600 text-md">
                    Timetable Division hasn't published the compre dates for
                    this course. Either there is no compre exam, or they haven't
                    decided it yet. We recommend checking with your professor.
                  </TooltipContent>
                </Tooltip>
              )}
            </span>
          </div>
        </div>
      ))}
      {courseSearchResults.length === 0 && (
        <div className="flex flex-col justify-center pt-4 items-center bg-secondary h-full rounded-xl">
          <Bird className="text-muted-foreground w-36 h-36 mb-4" />
          <span className="text-muted-foreground text-2xl">No results</span>
        </div>
      )}
    </div>
  );
};

export default CourseSearchResults;

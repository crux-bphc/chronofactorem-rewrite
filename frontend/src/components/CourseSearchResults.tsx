import { getClashingExamTimes } from "lib";
import { Bird, ChevronRight, HelpCircle } from "lucide-react";
import { useMemo } from "react";
import { useTimetableState } from "@/context";
import { useTimetableNav } from "@/lib/useTimetableNav";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export const CourseSearchResults = ({ query }: { query: string }) => {
  const {
    state: { courses, timetable },
  } = useTimetableState();
  const { openCourse } = useTimetableNav();

  const courseSearchResults = useMemo(() => {
    if (!courses || !timetable) return [];
    return courses
      .filter((course) =>
        `${course.code}: ${course.name}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      )
      .map((course) => ({
        ...course,
        clashing: getClashingExamTimes(course, timetable.examTimes),
      }));
  }, [courses, query, timetable]);

  return (
    <div className="h-[calc(100%-3rem)] overflow-y-scroll">
      {courseSearchResults.map((course) => (
        <button
          type="button"
          aria-disabled={!!course.clashing}
          onClick={() => {
            if (!course.clashing) {
              openCourse(course.id);
            }
          }}
          key={course.id}
          className={`w-full text-left px-4 transition flex-col pt-4 flex duration-200 ease-in-out border-t-2 border-muted-foreground/20 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring ${
            course.clashing
              ? "text-muted-foreground"
              : "cursor-pointer bg-secondary dark:hover:bg-slate-700 hover:bg-slate-200"
          }`}
        >
          <div className="w-full flex justify-between items-center">
            <span className="w-fit text-sm">
              {course.code}: {course.name}
            </span>
            <ChevronRight className="w-6 h-6" />
          </div>
          {course.clashing && (
            <div className="-mx-4 mt-1 py-1 dark:bg-slate-700/80 bg-slate-300/80 text-secondary-foreground text-center">
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
        </button>
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

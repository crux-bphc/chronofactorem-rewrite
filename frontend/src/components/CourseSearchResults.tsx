import { getClashingExamTimes } from "lib";
import { ChevronRight, Search } from "lucide-react";
import { useMemo } from "react";
import { TimetableActionType, useTimetableState } from "@/context";

const examDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "Not announced";

export const CourseSearchResults = ({
  debouncedSearchTerm,
}: {
  debouncedSearchTerm: string;
}) => {
  const {
    state: { courses, timetable },
    dispatch,
  } = useTimetableState();
  const results = useMemo(
    () =>
      (courses ?? [])
        .filter((course) =>
          `${course.code} ${course.name}`
            .toLowerCase()
            .includes(debouncedSearchTerm.trim().toLowerCase()),
        )
        .map((course) => ({
          ...course,
          clashing: getClashingExamTimes(course, timetable?.examTimes ?? []),
        })),
    [courses, debouncedSearchTerm, timetable?.examTimes],
  );

  return (
    <section
      className="h-[calc(100%-4rem)] overflow-y-auto"
      aria-label="Course search results"
    >
      <p className="px-2 pb-2 text-xs text-muted-foreground">
        {results.length} course{results.length === 1 ? "" : "s"}
      </p>
      {results.map((course) => (
        <div key={course.id} className="border-t">
          <button
            type="button"
            disabled={!!course.clashing}
            onClick={() =>
              dispatch({
                type: TimetableActionType.SetSelectedCourseAndSection,
                courseID: course.id,
                sectionType: null,
              })
            }
            className="flex w-full cursor-pointer items-start gap-2 rounded-lg p-3 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-default disabled:opacity-60"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{course.code}</span>
              <span className="mt-0.5 block text-sm">{course.name}</span>
              <span className="mt-2 block text-xs text-muted-foreground">
                Midsem: {examDate(course.midsemStartTime)}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Compre: {examDate(course.compreStartTime)}
              </span>
            </span>
            <ChevronRight className="mt-1 size-4 shrink-0" />
          </button>
          {course.clashing && (
            <p className="px-3 pb-3 text-xs text-destructive">
              Exam clash with{" "}
              {course.clashing
                .map((exam) => {
                  const [code, type] = exam.split("|");
                  return `${code} (${type.toLowerCase()})`;
                })
                .join(", ")}
            </p>
          )}
        </div>
      ))}
      {results.length === 0 && (
        <div className="flex flex-col items-center gap-3 p-6 text-center text-muted-foreground">
          <Search className="size-8" />
          <p>No matching courses.</p>
          <p className="text-sm">Try a course code or part of its name.</p>
        </div>
      )}
    </section>
  );
};
export default CourseSearchResults;

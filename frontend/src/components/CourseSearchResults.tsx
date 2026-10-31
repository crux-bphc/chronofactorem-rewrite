import { type courseType, getClashingExamTimes } from "lib";
import { Bird } from "lucide-react";
import { useMemo } from "react";
import type z from "zod";
import { useTimetableState } from "@/context";
import { formatExam } from "@/lib/formatTime";
import { panelForward } from "@/lib/panelTransition";
import { useTimetableNav } from "@/lib/useTimetableNav";
import { CourseRow } from "./CourseRow";

type Course = z.infer<typeof courseType>;

function ExamLines({ course }: { course: Course }) {
  return (
    <>
      <span className="mt-1 text-[13px] text-ink-muted">
        Midsem · {formatExam(course.midsemStartTime, course.midsemEndTime)}
      </span>
      <span className="text-[13px] text-ink-muted">
        Compre · {formatExam(course.compreStartTime, course.compreEndTime)}
      </span>
    </>
  );
}

export const CourseSearchResults = ({ query }: { query: string }) => {
  const {
    state: { courses, timetable },
  } = useTimetableState();
  const { openCourse } = useTimetableNav();

  const results = useMemo(() => {
    if (!courses || !timetable) return [];
    const needle = query.trim().toLowerCase();
    return courses
      .filter((course) =>
        `${course.code}: ${course.name}`.toLowerCase().includes(needle),
      )
      .map((course) => ({
        course,
        clashing: getClashingExamTimes(course, timetable.examTimes),
      }));
  }, [courses, query, timetable]);

  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <span className="sr-only" aria-live="polite">
        {results.length === 0
          ? "No results"
          : `${results.length} ${results.length === 1 ? "result" : "results"}`}
      </span>
      {results.length > 0 ? (
        <div
          key={query}
          className="mx-4 mt-2 mb-6 animate-[cf-fade-in_var(--d-2)_var(--e-out)] rounded-xl border border-line bg-surface lg:mx-0 [&>*+*]:border-t [&>*+*]:border-line [&>:first-child]:rounded-t-[calc(var(--radius-xl)-1px)] [&>:last-child]:rounded-b-[calc(var(--radius-xl)-1px)]"
        >
          {results.map(({ course, clashing }) => (
            <CourseRow
              key={course.id}
              course={course}
              clashing={clashing}
              extra={<ExamLines course={course} />}
              onOpen={panelForward(() => openCourse(course.id))}
            />
          ))}
        </div>
      ) : (
        <div className="flex animate-[cf-fade-in_var(--d-2)_var(--e-out)] flex-col items-center gap-3 px-4 pt-12 text-center">
          <Bird
            size={112}
            strokeWidth={1.25}
            aria-hidden="true"
            className="animate-[cf-hop_400ms_var(--e-out)_1] text-ink-faint"
          />
          <span className="text-[15px] font-medium text-ink-muted">
            No results
          </span>
        </div>
      )}
    </div>
  );
};

export default CourseSearchResults;

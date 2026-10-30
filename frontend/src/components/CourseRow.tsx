import { type courseType, getClashingExamTimes } from "lib";
import { ChevronRight } from "lucide-react";
import { Fragment } from "react";
import type z from "zod";
import { useTimetableState } from "@/context";
import { panelForward } from "@/lib/panelTransition";
import { titleCase } from "@/lib/titleCase";
import { useTimetableNav } from "@/lib/useTimetableNav";
import { cn } from "@/lib/utils";
import { ClashingWith, ClashPill, useExamClashPills } from "./ClashPills";
import { badgeVariants } from "./ui/badge";

type Course = z.infer<typeof courseType>;

const rowPad = "px-3.5 py-3";

function CourseText({ course }: { course: Course }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="text-[15px] font-semibold text-ink">{course.code}</span>
      <span className="text-[12.5px] text-ink-muted">
        {titleCase(course.name)}
      </span>
    </span>
  );
}

function ClashRow({
  course,
  clashing,
  className,
}: {
  course: Course;
  clashing: string[];
  className?: string;
}) {
  const pills = useExamClashPills(clashing);
  return (
    <div data-course-id={course.id} className={cn(rowPad, className)}>
      <button
        type="button"
        disabled
        className="block w-full text-left opacity-50"
      >
        <CourseText course={course} />
      </button>
      <ClashingWith>
        {pills.map((p) => (
          <ClashPill key={p.key} label={p.label} onSelect={p.onSelect} />
        ))}
      </ClashingWith>
    </div>
  );
}

export function CourseRow({
  course,
  pills,
  onOpen,
  clashing,
  className,
}: {
  course: Course;
  pills?: string[];
  onOpen?: () => void;
  clashing?: string[] | null;
  className?: string;
}) {
  if (clashing && clashing.length > 0) {
    return (
      <ClashRow course={course} clashing={clashing} className={className} />
    );
  }

  const content = (
    <>
      <CourseText course={course} />
      {pills && pills.length > 0 ? (
        <span className="flex flex-wrap justify-end gap-1">
          {pills.map((p) => (
            <span key={p} className={badgeVariants({ variant: "pill" })}>
              {p}
            </span>
          ))}
        </span>
      ) : (
        <span />
      )}
    </>
  );

  if (!onOpen) {
    return (
      <div
        data-course-id={course.id}
        className={cn(
          "grid min-h-[60px] grid-cols-[1fr_auto] items-center gap-2.5",
          rowPad,
          className,
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      data-course-id={course.id}
      onClick={onOpen}
      className={cn(
        "grid min-h-[60px] w-full cursor-pointer grid-cols-[1fr_auto_16px] items-center gap-2.5 text-left transition-colors duration-(--d-1) hover:bg-sunk",
        rowPad,
        className,
      )}
    >
      {content}
      <ChevronRight size={16} className="text-ink-faint" aria-hidden="true" />
    </button>
  );
}

function OptionRow({
  course,
  className,
}: {
  course: Course;
  className?: string;
}) {
  const {
    state: { timetable },
  } = useTimetableState();
  const { openCourse } = useTimetableNav();
  const clashing = timetable
    ? getClashingExamTimes(course, timetable.examTimes)
    : null;
  return (
    <CourseRow
      course={course}
      clashing={clashing}
      onOpen={panelForward(() => openCourse(course.id))}
      className={className}
    />
  );
}

export function OptionalSet({ options }: { options: Course[] }) {
  if (options.length === 1) return <OptionRow course={options[0]} />;
  return (
    // biome-ignore lint/a11y/useSemanticElements: options open pickers; not form fields
    <div
      role="group"
      aria-label="You have to pick only one of these options"
      className="relative before:pointer-events-none before:absolute before:top-3.5 before:bottom-3.5 before:left-1.5 before:w-0.5 before:rounded-full before:bg-line before:content-[''] [&>:first-child]:rounded-t-[inherit] [&>:last-child]:rounded-b-[inherit]"
    >
      {options.map((course, i) => (
        <Fragment key={course.id}>
          {i > 0 && (
            <div
              aria-hidden="true"
              className="flex h-3.5 items-center gap-2 pr-3.5 pl-5 before:h-px before:flex-1 before:bg-line before:content-[''] after:h-px after:flex-1 after:bg-line after:content-['']"
            >
              <span className="text-[11px] font-semibold uppercase tracking-[.06em] text-ink-faint">
                or
              </span>
            </div>
          )}
          <OptionRow course={course} className="pl-5" />
        </Fragment>
      ))}
    </div>
  );
}

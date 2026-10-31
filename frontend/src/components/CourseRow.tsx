import { type courseType, getClashingExamTimes } from "lib";
import { ChevronRight, X } from "lucide-react";
import { Fragment } from "react";
import type z from "zod";
import { useTimetableState } from "@/context";
import { HapticTap } from "@/lib/haptics";
import { panelForward } from "@/lib/panelTransition";
import { titleCase } from "@/lib/titleCase";
import { useTimetableNav } from "@/lib/useTimetableNav";
import { cn } from "@/lib/utils";
import { ClashingWith, ClashPill, useExamClashPills } from "./ClashPills";
import { badgeVariants } from "./ui/badge";

type Course = z.infer<typeof courseType>;

const rowPad = "px-3.5 py-3";

function CourseText({
  course,
  extra,
}: {
  course: Course;
  extra?: React.ReactNode;
}) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="text-[15px] leading-snug font-semibold text-ink">
        {titleCase(course.name)}
      </span>
      <span className="text-[12.5px] text-ink-muted">{course.code}</span>
      {extra}
    </span>
  );
}

function ClashRow({
  course,
  clashing,
  className,
  extra,
}: {
  course: Course;
  clashing: string[];
  className?: string;
  extra?: React.ReactNode;
}) {
  const pills = useExamClashPills(clashing);
  return (
    <div data-course-id={course.id} className={cn(rowPad, className)}>
      <button
        type="button"
        disabled
        className="block w-full text-left opacity-50"
      >
        <CourseText course={course} extra={extra} />
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
  onRemove,
  busy,
  clashing,
  className,
  extra,
}: {
  course: Course;
  pills?: string[];
  onOpen?: () => void;
  // needs onOpen; shows an × in place of the chevron
  onRemove?: () => void;
  busy?: boolean;
  clashing?: string[] | null;
  className?: string;
  extra?: React.ReactNode;
}) {
  if (clashing && clashing.length > 0) {
    return (
      <ClashRow
        course={course}
        clashing={clashing}
        className={className}
        extra={extra}
      />
    );
  }

  const content = (
    <>
      <CourseText course={course} extra={extra} />
      {pills && pills.length > 0 ? (
        <span className="flex flex-wrap justify-end gap-1">
          {pills.map((p) => (
            <span
              key={p}
              // pills are --sunk, the same as the row's hover
              className={cn(
                badgeVariants({ variant: "pill" }),
                "group-hover/row:bg-ev",
              )}
            >
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

  const open = (
    <button
      type="button"
      data-course-id={onRemove ? undefined : course.id}
      onClick={onOpen}
      className={cn(
        "grid min-h-[60px] w-full cursor-pointer items-center gap-2.5 text-left transition-colors duration-(--d-1) focus-visible:outline-offset-[-2px]",
        rowPad,
        // with an ×, the wrapper below takes the hover
        onRemove
          ? "grid-cols-[1fr_auto] pr-0"
          : "group/row grid-cols-[1fr_auto_16px] hover:bg-sunk",
        className,
      )}
    >
      {content}
      {!onRemove && (
        <ChevronRight size={16} className="text-ink-faint" aria-hidden="true" />
      )}
    </button>
  );

  if (!onRemove) return open;

  return (
    <div
      data-course-id={course.id}
      className="group/row flex overflow-hidden transition-colors duration-(--d-1) hover:bg-sunk"
    >
      {open}
      <button
        type="button"
        aria-label={`Remove ${course.code} from timetable`}
        aria-busy={busy || undefined}
        onClick={onRemove}
        className={cn(
          "group/x relative grid w-12 shrink-0 cursor-pointer place-items-center pr-1 text-ink-faint transition-colors duration-(--d-1) group-hover/row:text-ink-muted hover:text-ink focus-visible:outline-offset-[-2px]",
          busy && "cursor-progress",
        )}
      >
        <span className="grid size-7 place-items-center rounded-md transition-colors duration-(--d-1) group-hover/x:bg-ev">
          <X size={16} aria-hidden="true" />
        </span>
        {!busy && <HapticTap />}
      </button>
    </div>
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

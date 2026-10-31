import { Bird } from "lucide-react";

/** The bird with one line of hint text under it; the text is what is read out. */
export function EmptyState({
  hint,
  className = "",
  style,
}: {
  hint: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 text-center ${className}`}
      style={style}
    >
      <Bird
        aria-hidden="true"
        size={112}
        strokeWidth={1.25}
        className="text-ink-faint"
      />
      <p className="text-sm text-balance text-ink-muted">{hint}</p>
    </div>
  );
}

export const emptyTimetableHint = (mode: "edit" | "view" | "export") =>
  mode === "edit"
    ? "Add a course from Courses and exams to get started."
    : "This timetable has no classes yet.";

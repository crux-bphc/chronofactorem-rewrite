import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { useTimetableState } from "@/context";
import { panelForward } from "@/lib/panelTransition";
import { useTimetableNav } from "@/lib/useTimetableNav";
import { cn } from "@/lib/utils";
import { badgeVariants } from "./ui/badge";

const pillClass = cn(
  badgeVariants({ variant: "chip-brand" }),
  "h-8 px-3 text-[13px] font-semibold",
);

export function ClashPill({
  label,
  onSelect,
}: {
  label: string;
  onSelect?: () => void;
}) {
  if (!onSelect) return <span className={pillClass}>{label}</span>;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        pillClass,
        "relative cursor-pointer after:absolute after:-inset-x-[3px] after:-inset-y-[6px] after:content-['']",
      )}
    >
      {label}
      <ArrowRight size={14} aria-hidden="true" />
    </button>
  );
}

export function ClashingWith({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2.5">
      <span className="basis-full text-sm text-ink-muted">Clashing with</span>
      {children}
    </div>
  );
}

export function useExamClashPills(clashing: string[] | null) {
  const {
    state: { courses },
  } = useTimetableState();
  const { openCourse } = useTimetableNav();
  return useMemo(
    () =>
      (clashing ?? []).map((entry) => {
        const [code, exam] = entry.split("|");
        const id = courses?.find((c) => c.code === code)?.id;
        return {
          key: entry,
          label: `${code}'s ${exam.toLowerCase()}`,
          onSelect: id ? panelForward(() => openCourse(id)) : undefined,
        };
      }),
    [clashing, courses, openCourse],
  );
}

let landing: { courseId: string; type: string } | null = null;

export function markClashLanding(courseId: string, type: "L" | "P" | "T") {
  landing = { courseId, type };
}

/** True once, for the first render matching the marked course and type. */
export function useClashLanding(
  courseId: string | null,
  type: string | null,
): boolean {
  if (landing && landing.courseId === courseId && landing.type === type) {
    landing = null;
    return true;
  }
  return false;
}

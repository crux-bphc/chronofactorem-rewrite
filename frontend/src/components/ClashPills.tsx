import { ArrowRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
        const [code, exam = ""] = entry.split("|");
        const id = courses?.find((c) => c.code === code)?.id;
        return {
          key: entry,
          label: exam ? `${code}'s ${exam.toLowerCase()}` : code,
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

/**
 * True for the render matching the marked course and type. Render stays pure:
 * the one-shot slot is read here and cleared in an effect after commit.
 */
export function useClashLanding(
  courseId: string | null,
  type: string | null,
): boolean {
  const matches =
    landing !== null && landing.courseId === courseId && landing.type === type;
  const key = `${courseId}|${type}`;
  const [landedKey, setLandedKey] = useState<string | null>(null);
  useEffect(() => {
    if (!matches) return;
    landing = null;
    setLandedKey(key);
  }, [matches, key]);
  return matches || landedKey === key;
}

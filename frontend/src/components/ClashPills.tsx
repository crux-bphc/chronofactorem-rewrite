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

let landing: { courseId: string; type: string; nonce: number } | null = null;
let landingNonce = 0;

export function markClashLanding(courseId: string, type: "L" | "P" | "T") {
  landing = { courseId, type, nonce: ++landingNonce };
}

/**
 * The nonce of the clash landing on this course and type, or null. Every pill
 * tap gets a fresh nonce, so each landing can pulse once; opening the same
 * course any other way carries the old nonce and so never pulses again. Render
 * stays pure: the one-shot slot is read here and cleared in an effect.
 */
export function useClashLanding(
  courseId: string | null,
  type: string | null,
): number | null {
  const key = `${courseId}|${type}`;
  const pending =
    landing !== null && landing.courseId === courseId && landing.type === type
      ? landing.nonce
      : null;
  const [landed, setLanded] = useState<{ key: string; nonce: number } | null>(
    null,
  );
  useEffect(() => {
    if (pending === null) return;
    landing = null;
    setLanded({ key, nonce: pending });
  }, [pending, key]);
  return pending ?? (landed?.key === key ? landed.nonce : null);
}

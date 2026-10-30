import { useEffect, useMemo, useState } from "react";
import type { TimetableSectionType } from "@/utils/timetable";

export type Presence = "present" | "entering" | "leaving";

const LEAVE_MS = 200; // --d-2

/**
 * Tags each section as it comes and goes. A section id that wasn't in the
 * previous `sections` is `entering`; one that disappeared stays in the list as
 * `leaving` for --d-2 so it can animate out. Nothing is tagged on the first
 * render, and `disabled` (export) returns everything `present`.
 */
export function useSectionPresence(
  sections: TimetableSectionType[],
  opts: { disabled: boolean },
): { section: TimetableSectionType; presence: Presence }[] {
  // under reduced motion nothing animates, so nothing needs to linger either
  const off =
    opts.disabled ||
    (typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [prev, setPrev] = useState(sections);
  const [entering, setEntering] = useState<ReadonlySet<string>>(new Set());
  const [leaving, setLeaving] = useState<TimetableSectionType[]>([]);

  if (prev !== sections) {
    setPrev(sections);
    if (off) {
      if (entering.size) setEntering(new Set());
      if (leaving.length) setLeaving([]);
    } else {
      const before = new Set(prev.map((s) => s.id));
      const now = new Set(sections.map((s) => s.id));
      const added = sections.filter((s) => !before.has(s.id));
      const removed = prev.filter((s) => !now.has(s.id));
      if (added.length || removed.length) {
        setEntering(new Set(added.map((s) => s.id)));
        setLeaving([...leaving.filter((s) => !now.has(s.id)), ...removed]);
      }
    }
  }

  const busy = entering.size > 0 || leaving.length > 0;
  useEffect(() => {
    if (!busy) return;
    const timer = setTimeout(() => {
      setEntering(new Set());
      setLeaving([]);
    }, LEAVE_MS);
    return () => clearTimeout(timer);
  }, [busy, entering, leaving]);

  // a stable list, so consumers' memoized grids only rebuild on real changes
  return useMemo(() => {
    if (off) {
      return sections.map((section) => ({
        section,
        presence: "present" as const,
      }));
    }
    const live = new Set(sections.map((s) => s.id));
    return [
      ...sections.map((section) => ({
        section,
        presence: entering.has(section.id)
          ? ("entering" as const)
          : ("present" as const),
      })),
      ...leaving
        .filter((s) => !live.has(s.id))
        .map((section) => ({ section, presence: "leaving" as const })),
    ];
  }, [off, sections, entering, leaving]);
}

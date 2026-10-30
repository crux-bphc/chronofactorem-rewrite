import { useCallback, useMemo } from "react";
import { defaultDay } from "@/utils/timetableGrid";
import { useTimetableNav } from "./useTimetableNav";

/**
 * The phone surface's view and day, with their defaults when the URL has none:
 * the day view below 640px and the week otherwise, and today's weekday.
 */
export function useSurfaceNav(dayCount: number) {
  const { search, setView, showDay } = useTimetableNav();
  const view: "day" | "week" =
    search.view ??
    (window.matchMedia("(max-width: 639px)").matches ? "day" : "week");
  const day = Math.min(
    search.day ?? defaultDay(dayCount, new Date()),
    dayCount - 1,
  );
  const show = useCallback((d: number) => showDay(d), [showDay]);
  return useMemo(
    () => ({ view, day, setView, showDay: show }),
    [view, day, setView, show],
  );
}

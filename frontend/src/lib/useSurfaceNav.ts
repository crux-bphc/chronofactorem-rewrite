import { useRouter } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import { defaultDay } from "@/utils/timetableGrid";
import type { TimetableSearch } from "./timetableSearch";
import { useTimetableNav } from "./useTimetableNav";

const resolve = (search: TimetableSearch, dayCount: number) => ({
  view:
    search.view ??
    (window.matchMedia("(max-width: 639px)").matches
      ? ("day" as const)
      : ("week" as const)),
  day: Math.min(search.day ?? defaultDay(dayCount, new Date()), dayCount - 1),
});

/**
 * The phone surface's view and day, with their defaults when the URL has none:
 * the day view below 640px and the week otherwise, and today's weekday.
 */
export function useSurfaceNav(dayCount: number) {
  const { search, setView, showDay } = useTimetableNav();
  const router = useRouter();
  const { view, day } = resolve(search, dayCount);
  // Taps compare against the latest location, not this render's, so a second
  // tap that lands before the first has rendered still counts.
  const latest = useCallback(
    () => resolve(router.latestLocation.search as TimetableSearch, dayCount),
    [router, dayCount],
  );
  // the day view slides between days; from the week, the tiles morph into
  // the day's agenda
  const show = useCallback(
    (d: number) => {
      const cur = latest();
      if (cur.view === "day") {
        if (d === cur.day) return;
        // the swipe scrolls back up from here; read it before a shorter day
        // clamps it
        document.documentElement.style.setProperty(
          "--tt-day-scroll",
          `${window.scrollY}px`,
        );
        return showDay(d, d > cur.day ? "day-next" : "day-prev");
      }
      return showDay(d, "view-morph");
    },
    [latest, showDay],
  );
  const set = useCallback(
    (v: "day" | "week") =>
      setView(v, v === latest().view ? undefined : "view-morph"),
    [latest, setView],
  );
  return useMemo(
    () => ({ view, day, setView: set, showDay: show }),
    [view, day, set, show],
  );
}

import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import type { TimetableSearch } from "./timetableSearch";

type SectionType = "L" | "P" | "T";

const isPhone = () => !window.matchMedia("(min-width: 1024px)").matches;

/**
 * Editor/view navigation state lives in URL search params so the browser and
 * phone back button walk back through sheets, courses and section types.
 * Opening a sheet or course pushes; everything else replaces.
 */
export function useTimetableNav() {
  const search = useSearch({ strict: false }) as TimetableSearch;
  const navigate = useNavigate();
  const router = useRouter();

  // The route is not known statically here (edit and view share this hook),
  // so navigate relative to the current location and loosen the typing.
  const go = useCallback(
    (
      update: (prev: TimetableSearch) => TimetableSearch,
      opts: { push: boolean },
    ) => {
      // biome-ignore lint/suspicious/noExplicitAny: shared by two routes
      (navigate as any)({
        search: update,
        ...(opts.push
          ? { state: { chronoNav: true } }
          : { replace: true, state: true }),
      });
    },
    [navigate],
  );

  const back = useCallback(
    (strip: (prev: TimetableSearch) => TimetableSearch) => {
      if ((router.state.location.state as { chronoNav?: boolean }).chronoNav) {
        router.history.back();
      } else {
        go(strip, { push: false });
      }
    },
    [router, go],
  );

  return useMemo(
    () => ({
      search,
      openSheet: (sheet: "courses" | "warnings") =>
        go((p) => ({ ...p, sheet }), { push: true }),
      closeSheet: () =>
        back(({ sheet: _s, course: _c, type: _t, q: _q, ...rest }) => rest),
      setTab: (tab: NonNullable<TimetableSearch["tab"]>) =>
        go((p) => ({ ...p, tab }), { push: false }),
      setExam: (exam: "midsem" | "compre") =>
        go((p) => ({ ...p, exam }), { push: false }),
      openCourse: (courseId: string, type?: SectionType) =>
        go(
          (p) => ({
            ...p,
            course: courseId,
            type,
            ...(isPhone() ? { sheet: "courses" as const } : {}),
          }),
          { push: true },
        ),
      closeCourse: () => back(({ course: _c, type: _t, ...rest }) => rest),
      setType: (type: SectionType) =>
        go((p) => ({ ...p, type }), { push: false }),
      setView: (view: "day" | "week") =>
        go((p) => ({ ...p, view }), { push: false }),
      setDay: (day: number) => go((p) => ({ ...p, day }), { push: false }),
      setQuery: (q: string) => go((p) => ({ ...p, q }), { push: false }),
    }),
    [search, go, back],
  );
}

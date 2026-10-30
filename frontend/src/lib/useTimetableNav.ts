import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import type { TimetableSearch } from "./timetableSearch";

type SectionType = "L" | "P" | "T";

type NavState = {
  chronoNav?: boolean;
  sheetDepth?: number;
  // The sheet was already open on the entry below the first push (deep link).
  sheetDeepRoot?: boolean;
};

const stripSheet = ({
  sheet: _s,
  course: _c,
  type: _t,
  q: _q,
  ...rest
}: TimetableSearch): TimetableSearch => rest;

const isPhone = () => !window.matchMedia("(min-width: 1024px)").matches;

/**
 * Editor/view navigation state lives in URL search params so the browser and
 * phone back button walk back through sheets, courses and section types.
 * Opening a sheet or course pushes; everything else replaces.
 *
 * Pushed entries record how many entries deep into the open sheet they are
 * (`sheetDepth`), so closing the sheet can pop all of them in one go.
 */
export function useTimetableNav() {
  const search = useSearch({ strict: false }) as TimetableSearch;
  const navigate = useNavigate();
  const router = useRouter();

  // The route is not known statically here (edit and view share this hook),
  // so navigate relative to the current location and loosen the typing.
  const go = useCallback(
    async (
      update: (prev: TimetableSearch) => TimetableSearch,
      opts: { push: boolean },
    ) => {
      let state: NavState | true = true;
      if (opts.push) {
        const cur = router.latestLocation;
        const curSearch = cur.search as TimetableSearch;
        const curState = cur.state as NavState;
        const next = update(curSearch);
        state = next.sheet
          ? {
              chronoNav: true,
              sheetDepth: curSearch.sheet ? (curState.sheetDepth ?? 0) + 1 : 1,
              sheetDeepRoot: curSearch.sheet
                ? curState.sheetDepth
                  ? curState.sheetDeepRoot
                  : true
                : undefined,
            }
          : { chronoNav: true };
      }
      // biome-ignore lint/suspicious/noExplicitAny: shared by two routes
      await (navigate as any)({
        search: update,
        // Search-only changes keep the page where it is.
        resetScroll: false,
        state,
        ...(opts.push ? {} : { replace: true }),
      });
    },
    [navigate, router],
  );

  const back = useCallback(
    (strip: (prev: TimetableSearch) => TimetableSearch) => {
      if ((router.state.location.state as NavState).chronoNav) {
        router.history.back();
      } else {
        go(strip, { push: false });
      }
    },
    [router, go],
  );

  const pushSheetIfClosed = useCallback(async () => {
    if (!router.latestLocation.search.sheet) {
      await go((p) => ({ ...p, sheet: "courses" as const }), { push: true });
    }
  }, [router, go]);

  return useMemo(
    () => ({
      search,
      openSheet: (sheet: "courses" | "warnings") => {
        if (router.latestLocation.search.sheet === sheet) return;
        return go((p) => ({ ...p, sheet }), { push: true });
      },
      closeSheet: () => {
        const loc = router.state.location;
        const { sheetDepth, sheetDeepRoot } = loc.state as NavState;
        if (!sheetDepth || !loc.search.sheet) {
          back(stripSheet);
          return;
        }
        if (sheetDeepRoot) {
          // The entry we land on was deep-linked with the sheet open; strip
          // it in place once the history move has resolved.
          const unsub = router.subscribe("onResolved", () => {
            unsub();
            go(stripSheet, { push: false });
          });
        }
        router.history.go(-sheetDepth);
      },
      setTab: (tab: NonNullable<TimetableSearch["tab"]>) =>
        go((p) => ({ ...p, tab }), { push: false }),
      setExam: (exam: "midsem" | "compre") =>
        go((p) => ({ ...p, exam }), { push: false }),
      showTab: async (tab: NonNullable<TimetableSearch["tab"]>) => {
        const phone = isPhone();
        // Phone: the tab lives inside the courses sheet; push the sheet first
        // so back closes it instead of leaving the editor.
        if (phone) await pushSheetIfClosed();
        await go(
          ({ course: _c, type: _t, ...rest }) => ({
            ...rest,
            tab,
            ...(phone ? { sheet: "courses" as const } : {}),
          }),
          { push: false },
        );
      },
      openCourse: async (
        courseId: string,
        type?: SectionType,
        tab?: NonNullable<TimetableSearch["tab"]>,
      ) => {
        const phone = isPhone();
        const cur = router.latestLocation.search;
        const update = (p: TimetableSearch): TimetableSearch => ({
          ...p,
          course: courseId,
          type,
          ...(tab ? { tab } : {}),
          ...(phone ? { sheet: "courses" as const } : {}),
        });
        // Already showing this course and type: refresh in place, no new entry.
        if (cur.course === courseId && cur.type === type) {
          await go(update, { push: false });
          return;
        }
        // Phone: the course lives inside the courses sheet. If the sheet is
        // closed, push the list first so back returns to it before closing.
        if (phone) await pushSheetIfClosed();
        await go(update, { push: true });
      },
      closeCourse: () => back(({ course: _c, type: _t, ...rest }) => rest),
      setType: (type: SectionType) =>
        go((p) => ({ ...p, type }), { push: false }),
      setView: (view: "day" | "week") =>
        go((p) => ({ ...p, view }), { push: false }),
      setDay: (day: number) => go((p) => ({ ...p, day }), { push: false }),
      showDay: (day: number) =>
        go((p) => ({ ...p, view: "day" as const, day }), { push: false }),
      setQuery: (q: string) =>
        go(({ q: _q, ...rest }) => (q ? { ...rest, q } : rest), {
          push: false,
        }),
    }),
    [search, go, back, router, pushSheetIfClosed],
  );
}

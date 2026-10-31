import { useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import { useCallback, useMemo } from "react";
import type { TimetableSearch } from "./timetableSearch";
import {
  markSheetClosing,
  prefersReducedMotion,
  type SurfaceTransition,
  supportsTransitionTypes,
} from "./viewTransitions";

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
 * phone back button walk back through sheets and courses. Opening a sheet or
 * another course pushes; everything else (section types included) replaces.
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
      opts: { push: boolean; transition?: SurfaceTransition },
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
        // A typed surface transition, or none. Only history pops fall through
        // to the router default (`routeTransitionTypes`), so in-app moves that
        // a caller already wraps in a transition never start a second one.
        viewTransition:
          opts.transition &&
          !prefersReducedMotion() &&
          supportsTransitionTypes()
            ? { types: [opts.transition] }
            : false,
        ...(opts.push ? {} : { replace: true }),
      });
    },
    [navigate, router],
  );

  const back = useCallback(
    (
      strip: (prev: TimetableSearch) => TimetableSearch,
      transition?: SurfaceTransition,
    ) => {
      if ((router.latestLocation.state as NavState).chronoNav) {
        // the pop is animated by the router's default transition
        router.history.back();
      } else {
        go(strip, { push: false, transition });
      }
    },
    [router, go],
  );

  // Pushes the bare course list, so back from a course opened over a closed
  // sheet returns to the list before closing.
  const pushSheetIfClosed = useCallback(async () => {
    if (!router.latestLocation.search.sheet) {
      await go(
        ({ course: _c, type: _t, ...p }) => ({
          ...p,
          sheet: "courses" as const,
        }),
        { push: true },
      );
    }
  }, [router, go]);

  return useMemo(
    () => ({
      search,
      openSheet: (sheet: "courses" | "warnings") => {
        if (router.latestLocation.search.sheet === sheet) return;
        if (sheet === "warnings" && isPhone()) {
          return go(
            ({ course: _c, type: _t, q: _q, ...p }) => ({ ...p, sheet }),
            { push: true },
          );
        }
        return go((p) => ({ ...p, sheet }), { push: true });
      },
      closeSheet: () => {
        const loc = router.latestLocation;
        const { sheetDepth, sheetDeepRoot } = loc.state as NavState;
        if (!sheetDepth || !loc.search.sheet) {
          back(stripSheet);
          return;
        }
        if (sheetDeepRoot) {
          // The entry we land on was deep-linked with the sheet open; strip
          // it in place once the history move has resolved.
          let timer: ReturnType<typeof setTimeout> | undefined;
          const unsub = router.subscribe("onResolved", () => {
            clearTimeout(timer);
            unsub();
            go(stripSheet, { push: false, transition: undefined });
          });
          // don't leave a stray listener behind if the move never resolves,
          // and never leave the URL claiming a sheet the user just closed
          timer = setTimeout(() => {
            unsub();
            if (router.latestLocation.search.sheet)
              go(stripSheet, { push: false, transition: undefined });
          }, 1000);
          markSheetClosing();
        }
        router.history.go(-sheetDepth);
      },
      setTab: (tab: NonNullable<TimetableSearch["tab"]>) =>
        go((p) => ({ ...p, tab }), { push: false }),
      setExam: (exam: "midsem" | "compre") =>
        go((p) => ({ ...p, exam }), { push: false }),
      showTab: async (tab: NonNullable<TimetableSearch["tab"]>) => {
        const phone = isPhone();
        // Phone: the tab lives inside the courses sheet. Unless that sheet is
        // already showing, push it (from no sheet or from warnings) so back
        // returns to where the user was instead of leaving the editor.
        await go(
          ({ course: _c, type: _t, ...rest }) => ({
            ...rest,
            tab,
            ...(phone ? { sheet: "courses" as const } : {}),
          }),
          {
            push: phone && router.latestLocation.search.sheet !== "courses",
          },
        );
      },
      openCourse: async (
        courseId: string,
        type?: SectionType,
        tab?: NonNullable<TimetableSearch["tab"]>,
      ) => {
        const phone = isPhone();
        const cur = router.latestLocation.search;
        // A `type` deep-links a section type (timetable blocks, clash pills);
        // without one the default type shows, or the course's current type if
        // it is already open.
        const update = (p: TimetableSearch): TimetableSearch => ({
          ...p,
          course: courseId,
          type: type ?? (p.course === courseId ? p.type : undefined),
          ...(tab ? { tab } : {}),
          ...(phone ? { sheet: "courses" as const } : {}),
        });
        // Already showing this course: switch type in place, no new entry, so
        // back returns to the previous course rather than the previous type.
        // On a phone it only shows inside the courses sheet; `course` alone
        // (say, carried over from desktop) still needs the sheet opened.
        if (cur.course === courseId && (!phone || cur.sheet === "courses")) {
          await go(update, { push: false });
          return;
        }
        // Phone: the course lives inside the courses sheet. If the sheet is
        // closed, push the list first so back returns to it before closing.
        // From the warnings sheet the course is pushed straight over it, so
        // back returns to Warnings.
        if (phone) await pushSheetIfClosed();
        await go(update, { push: true });
      },
      closeCourse: () =>
        back(({ course: _c, type: _t, ...rest }) => rest, "panel-back"),
      setType: (type: SectionType) =>
        go((p) => ({ ...p, type }), { push: false }),
      setView: (view: "day" | "week", transition?: SurfaceTransition) =>
        go((p) => ({ ...p, view }), { push: false, transition }),
      setDay: (day: number, transition?: SurfaceTransition) =>
        go((p) => ({ ...p, day }), { push: false, transition }),
      showDay: (day: number, transition?: SurfaceTransition) =>
        go((p) => ({ ...p, view: "day" as const, day }), {
          push: false,
          transition,
        }),
      setQuery: (q: string) =>
        go(({ q: _q, ...rest }) => (q ? { ...rest, q } : rest), {
          push: false,
        }),
    }),
    [search, go, back, router, pushSheetIfClosed],
  );
}

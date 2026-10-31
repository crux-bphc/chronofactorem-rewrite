import type { ParsedLocation } from "@tanstack/react-router";
import { timetableId } from "./sharedTransition";
import type { TimetableSearch } from "./timetableSearch";

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Whether `document.startViewTransition({ types })` is understood. */
export const supportsTransitionTypes = () =>
  typeof document !== "undefined" &&
  typeof document.startViewTransition === "function" &&
  typeof ViewTransition !== "undefined" &&
  "types" in ViewTransition.prototype &&
  typeof CSS !== "undefined" &&
  CSS.supports("selector(:active-view-transition-type(a))");

const tsrIndex = (location: ParsedLocation) =>
  (location.state as { __TSR_index?: number }).__TSR_index ?? 0;

/**
 * Whether a search-only move swaps the course panel: a different course (or
 * none), or one open sheet replaced by another. A sheet opening or closing
 * is the sheet's own motion, so it never slides the panel.
 */
export const panelMoved = (a: TimetableSearch, b: TimetableSearch): boolean => {
  if (!!a.sheet !== !!b.sheet) return false;
  return (
    (a.course ?? null) !== (b.course ?? null) ||
    (!!a.sheet && a.sheet !== b.sheet)
  );
};

let sheetClosePending = false;

/**
 * Marks the next history pop as part of closing the sheet, so it does not
 * slide the course panel under the sheet's own exit. Self-clears.
 */
export function markSheetClosing(): void {
  sheetClosePending = true;
  setTimeout(() => {
    sheetClosePending = false;
  }, 1000);
}

/**
 * View transition types for router navigations without explicit types. In-app
 * search moves pass `viewTransition: false` (or their own types), so in
 * practice this covers route changes and history pops. Search-only pops that
 * move the course panel slide it; other search-only moves and reduced-motion
 * users get no transition. Route changes also morph the timetable title and
 * grid (`shared-timetable`), except into a different timetable, such as a
 * fresh copy, whose page should replace the old one whole.
 */
export function routeTransitionTypes(info: {
  fromLocation?: ParsedLocation;
  toLocation: ParsedLocation;
  pathChanged: boolean;
}): string[] | false {
  if (!info.fromLocation) return false;
  if (typeof window !== "undefined" && prefersReducedMotion()) return false;
  const back = tsrIndex(info.toLocation) < tsrIndex(info.fromLocation);
  if (!info.pathChanged) {
    if (sheetClosePending) {
      sheetClosePending = false;
      return false;
    }
    if (
      !panelMoved(
        info.fromLocation.search as TimetableSearch,
        info.toLocation.search as TimetableSearch,
      )
    )
      return false;
    return back ? ["panel-back"] : ["panel-forward"];
  }
  document.documentElement.toggleAttribute(
    "data-navbar-still",
    window.scrollY === 0,
  );
  const from = timetableId(info.fromLocation);
  const to = timetableId(info.toLocation);
  const types = back ? ["back"] : ["forward"];
  if (!from || !to || from === to) types.push("shared-timetable");
  return types;
}

/**
 * The navbar holds still through a route slide only while it sits at the top
 * of both pages; otherwise it would jump between them. `routeTransitionTypes`
 * marks it from the old page's scroll, and this unmarks it once the new page
 * has restored its scroll, before the new snapshot is taken.
 */
export function releaseStillNavbar(): void {
  if (window.scrollY !== 0)
    document.documentElement.removeAttribute("data-navbar-still");
}

/**
 * Runs `apply` inside a circular-reveal view transition growing from `origin`.
 * Falls back to calling `apply` directly when unsupported or reduced motion.
 */
export function startThemeTransition(
  apply: () => void,
  origin: { x: number; y: number },
): void {
  if (!document.startViewTransition || prefersReducedMotion()) {
    apply();
    return;
  }
  const root = document.documentElement;
  root.classList.add("theme-transition");
  const transition = document.startViewTransition(apply);
  const radius = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  );
  const style = getComputedStyle(root);
  const duration = style.getPropertyValue("--d-4").trim() || "480ms";
  const easing = style.getPropertyValue("--e-in-out").trim() || "ease-in-out";
  transition.ready
    .then(() => {
      root.animate(
        {
          clipPath: [
            `circle(0px at ${origin.x}px ${origin.y}px)`,
            `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
          ],
        },
        {
          duration:
            Number.parseFloat(duration) * (duration.endsWith("ms") ? 1 : 1000),
          easing,
          fill: "forwards",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => {});
  const cleanup = () => root.classList.remove("theme-transition");
  transition.finished.then(cleanup, cleanup);
}

/** Same-route timetable surface changes (spec §9). */
export type SurfaceTransition =
  | "day-next"
  | "day-prev"
  | "view-morph"
  | "orient"
  | "panel-forward"
  | "panel-back";

/**
 * Runs `update` inside a typed view transition. Without support for types, or
 * under reduced motion, `update` simply runs. `update` must commit the DOM
 * synchronously (wrap React state in `flushSync`).
 */
export function startSurfaceTransition(
  type: SurfaceTransition,
  update: () => void,
): void {
  if (prefersReducedMotion() || !supportsTransitionTypes()) {
    update();
    return;
  }
  let ran = false;
  const run = () => {
    if (ran) return;
    ran = true;
    update();
  };
  try {
    const transition = document.startViewTransition({
      update: run,
      types: [type],
    });
    transition.ready.catch(() => {});
    transition.finished.catch(() => {});
    transition.updateCallbackDone.catch(() => {});
  } catch {
    run();
  }
}

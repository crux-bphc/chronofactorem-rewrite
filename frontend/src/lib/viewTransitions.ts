import type { ParsedLocation } from "@tanstack/react-router";

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const tsrIndex = (location: ParsedLocation) =>
  (location.state as { __TSR_index?: number }).__TSR_index ?? 0;

/**
 * View transition types for route changes. Search-only or hash-only
 * navigations (same pathname) and reduced-motion users get no transition.
 */
export function routeTransitionTypes(info: {
  fromLocation?: ParsedLocation;
  toLocation: ParsedLocation;
  pathChanged: boolean;
}): string[] | false {
  if (!info.pathChanged || !info.fromLocation) return false;
  if (typeof window !== "undefined" && prefersReducedMotion()) return false;
  return tsrIndex(info.toLocation) < tsrIndex(info.fromLocation)
    ? ["back"]
    : ["forward"];
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
  const duration = style.getPropertyValue("--d-3").trim() || "300ms";
  const easing = style.getPropertyValue("--e-out").trim() || "ease-out";
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
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => {});
  const cleanup = () => root.classList.remove("theme-transition");
  transition.finished.then(cleanup, cleanup);
}

import type React from "react";
import { useLayoutEffect, useState } from "react";
import { prefersReducedMotion } from "./viewTransitions";

// the page skeleton that left the screen in the commit being made, for the
// page that replaced it; cleared once that commit is done
let leaving: { page: string; node: HTMLElement; rect: DOMRect } | null = null;

/**
 * A ref for a page skeleton's root. When the skeleton leaves, it notes where
 * it was, so the page that replaces it can fade it out on top of itself
 * (useSkeletonCrossfade). Make one per page at module scope, so React keeps
 * the same ref.
 */
export const skeletonRef =
  (page: string) => (node: HTMLElement | null) => () => {
    if (!node) return;
    // refs detach before React takes the node out of the page, so it still
    // has its box here
    leaving = { page, node, rect: node.getBoundingClientRect() };
    queueMicrotask(() => {
      leaving = null;
    });
  };

/**
 * Crossfades from `page`'s skeleton to the page: when the skeleton leaves in
 * the same commit as the page renders, a copy of it is laid over the page
 * and faded out, so its blocks dissolve into the content they stood for.
 * A skeleton that was never shown (fast loads, where the route's view
 * transition is the motion) leaves nothing to fade.
 */
export function useSkeletonCrossfade(page: string) {
  useLayoutEffect(() => {
    if (leaving?.page !== page) return;
    const { node, rect } = leaving;
    leaving = null;
    if (prefersReducedMotion()) return;
    const ghost = node.cloneNode(true) as HTMLElement;
    ghost.removeAttribute("role");
    ghost.removeAttribute("aria-busy");
    ghost.setAttribute("aria-hidden", "true");
    ghost.inert = true;
    Object.assign(ghost.style, {
      position: "fixed",
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      margin: "0",
    });
    ghost.classList.add("skeleton-ghost");
    const done = (e: AnimationEvent) => {
      if (e.target === ghost) ghost.remove();
    };
    ghost.addEventListener("animationend", done);
    ghost.addEventListener("animationcancel", done);
    document.body.append(ghost);
  });
}

/**
 * For skeletons inside a page (a course's sections, announcements): fades
 * the content in when it arrives in a skeleton's place, but not when the
 * data was already there. Put `className` on what replaced the skeleton, and
 * `onAnimationEnd` on one of those, so the fade doesn't replay when the
 * content mounts again later.
 */
export function useSkeletonFadeIn(loading: boolean) {
  const [waited, setWaited] = useState(loading);
  if (loading && !waited) setWaited(true);
  return {
    className:
      waited && !loading
        ? "motion-safe:animate-[skeleton-fade-in_var(--d-2)_var(--e-out)]"
        : "",
    onAnimationEnd: (e: React.AnimationEvent) => {
      if (e.target === e.currentTarget) setWaited(false);
    },
  };
}

import type { NavigateOptions } from "@tanstack/react-router";
import { router } from "../router";

// <Link> preloads its page on hover and focus (defaultPreload: "intent"), but
// buttons that navigate from a handler don't. These give such buttons the same
// head start. Loaders only make GET requests, so preloading has no side
// effects.

/** Hover/focus handlers that load a page's code and run its loader. */
export const preloadOnIntent = (to: NavigateOptions) => {
  const preload = () => {
    router.preloadRoute(to);
  };
  return { onPointerEnter: preload, onFocus: preload };
};

/** For a page whose params come back from a mutation, so only its code can
 * load ahead. */
export const preloadEditorOnIntent = () => {
  const preload = () => {
    router.loadRouteChunk(router.routesByPath["/edit/$timetableId"]);
  };
  return { onPointerEnter: preload, onFocus: preload };
};

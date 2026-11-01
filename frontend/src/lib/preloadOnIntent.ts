import type { NavigateOptions } from "@tanstack/react-router";
import { router } from "../router";

// Used on buttons that navigate to pages with loaders, so we can preload those
export const preloadOnIntent = (to: NavigateOptions) => {
  const preload = () => {
    router.preloadRoute(to);
  };
  return { onPointerEnter: preload, onFocus: preload };
};

// Used on buttons that navigate to pages with loaders, so we can preload those
export const preloadEditorOnIntent = () => {
  const preload = () => {
    router.loadRouteChunk(router.routesByPath["/edit/$timetableId"]);
  };
  return { onPointerEnter: preload, onFocus: preload };
};

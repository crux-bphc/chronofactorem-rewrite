import { useSyncExternalStore } from "react";

const desktopQuery = "(min-width: 1024px)";

export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const media = window.matchMedia(desktopQuery);
      media.addEventListener("change", notify);
      return () => media.removeEventListener("change", notify);
    },
    () => window.matchMedia(desktopQuery).matches,
  );
}

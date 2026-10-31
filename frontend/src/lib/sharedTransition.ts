// frontend/src/lib/sharedTransition.ts
import type { ParsedLocation } from "@tanstack/react-router";

/**
 * Shared-element view transition between a home card and the timetable
 * pages. A name may appear only once per page, so home gives them to the
 * card of the timetable at the other end of the navigation, and to no card
 * at all when home is entered from or left for any other page.
 */
export const TIMETABLE_TITLE_VT = "timetable-title";
export const TIMETABLE_GRID_VT = "timetable-grid";

let sharedId: string | null = null;
const listeners = new Set<() => void>();

export function setSharedTimetable(id: string | null): void {
  if (id === sharedId) return;
  sharedId = id;
  for (const listener of listeners) listener();
}

export function getSharedTimetable(): string | null {
  return sharedId;
}

export function subscribeSharedTimetable(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const timetableId = (location: ParsedLocation | undefined) =>
  location?.pathname.match(/^\/(?:edit|view|finalize)\/([^/]+)\/?$/)?.[1] ??
  null;

/**
 * Router `onBeforeNavigate` hook: runs before the old snapshot is taken, so
 * home names the card only for a move between it and that timetable's page.
 */
export function trackSharedTimetable(info: {
  fromLocation?: ParsedLocation;
  toLocation: ParsedLocation;
}): void {
  const { fromLocation, toLocation } = info;
  setSharedTimetable(
    toLocation.pathname === "/"
      ? timetableId(fromLocation)
      : fromLocation?.pathname === "/"
        ? timetableId(toLocation)
        : null,
  );
}

import type { ParsedLocation } from "@tanstack/react-router";

// A view-transition name may appear only once per page, so only the card
// at the other end of a home <-> timetable navigation gets these. They
// resolve only during the transitions that morph them (index.css,
// `shared-timetable` and the view-morph/orient types): named elements paint
// above the page snapshot, so naming them in every transition would draw the
// title and grid over the phone sheet or the copying dialog.
export const TIMETABLE_TITLE_VT = "var(--vt-timetable-title)";
export const TIMETABLE_GRID_VT = "var(--vt-timetable-grid)";

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

export const timetableId = (location: ParsedLocation | undefined) =>
  location?.pathname.match(/^\/(?:edit|view|finalize)\/([^/]+)\/?$/)?.[1] ??
  null;

// Must run on onBeforeNavigate, before the old snapshot is taken.
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

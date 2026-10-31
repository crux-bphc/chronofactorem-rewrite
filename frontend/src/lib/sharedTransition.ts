// frontend/src/lib/sharedTransition.ts
/**
 * Shared-element view transition between a home card and the timetable
 * pages. A name may appear only once per page, so home gives them to the
 * card of the timetable that was last opened from (or finished into) home.
 */
export const TIMETABLE_TITLE_VT = "timetable-title";
export const TIMETABLE_GRID_VT = "timetable-grid";

let sharedId: string | null = null;

export function setSharedTimetable(id: string | null): void {
  sharedId = id;
}

export function getSharedTimetable(): string | null {
  return sharedId;
}

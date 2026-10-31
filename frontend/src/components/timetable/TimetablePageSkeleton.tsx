import { useSearch } from "@tanstack/react-router";
import { Columns3, Rows3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { skeletonRef } from "@/lib/skeletonFade";
import type { TimetableSearch } from "@/lib/timetableSearch";
import { useIsDesktop } from "@/lib/useIsDesktop";
import { formatAxisHour } from "@/utils/timeFormat";
import { defaultDay, timetableDayNames } from "@/utils/timetableGrid";

const ref = skeletonRef("timetable");

// a few week-grid tiles to suggest classes: [day, hour, span]
const weekTiles = [
  [0, 1, 1],
  [2, 1, 1],
  [4, 1, 1],
  [1, 2, 1],
  [3, 2, 1],
  [0, 5, 2],
  [2, 5, 2],
  [1, 7, 1],
  [3, 8, 1],
  [4, 8, 1],
] as const;

/**
 * The editor's and view page's loading state, shaped like their shells
 * (TimetablePageShell, TimetableHeader, TimetableDock) so nothing jumps when
 * the page arrives. It runs before the page's data and TimetableProvider
 * exist, so it reads nothing from the timetable. It carries none of the
 * shared view-transition names: those belong to the real page. The shell
 * crossfades from it when it arrives (useSkeletonCrossfade).
 */
export function TimetablePageSkeleton({
  page = "edit",
}: {
  page?: "edit" | "view";
}) {
  const isDesktop = useIsDesktop();
  const search = useSearch({ strict: false }) as TimetableSearch;
  // The header's meta line holds the status chip on the view page, which is
  // taller than the text line (TimetableStatusChip).
  const metaHeight = page === "view" ? "h-[23.5px]" : "h-[1lh]";

  if (!isDesktop) {
    // the dock's day and view as useSurfaceNav resolves them, so the pills
    // and the switch don't move when the page arrives (Saturday can't be
    // known before the data, so the pills are Mon-Fri)
    const view =
      search.view ??
      (window.matchMedia("(max-width: 639px)").matches ? "day" : "week");
    const day = Math.min(search.day ?? defaultDay(5, new Date()), 4);
    return (
      <div
        ref={ref}
        role="status"
        aria-label="Loading"
        className="w-full flex-1"
      >
        <div className="border-b border-line">
          <div className="mx-auto max-w-[640px] px-4 pt-0.5 pb-3">
            <div className="flex h-[1lh] items-center text-2xl leading-[1.15]">
              <Skeleton className="h-[26px] w-[210px]" />
            </div>
            <div
              className={`mt-[5px] flex items-center text-[13px] ${metaHeight}`}
            >
              <Skeleton className="h-[13px] w-[140px]" />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-[640px]">
          {view === "week" ? (
            // WeekGrid's frame: same columns, rows and labels (the hours
            // start at the grid's fixed first hour), with placeholder tiles
            <div
              className="relative grid gap-x-[3px] gap-y-1.5 px-2.5 py-1 [--tt-row:48px] sm:[--tt-row:64px]"
              style={{
                gridTemplateColumns: "40px repeat(5, minmax(0, 1fr))",
                gridTemplateRows: "22px repeat(10, var(--tt-row))",
              }}
            >
              {timetableDayNames.slice(0, 5).map((name, d) => (
                <div
                  key={name}
                  className="self-end pb-1 text-center text-xs font-semibold tracking-[.06em] text-ink-muted uppercase"
                  style={{ gridColumn: d + 2, gridRow: 1 }}
                >
                  {name.slice(0, 3)}
                </div>
              ))}
              {Array.from({ length: 10 }, (_, h) => (
                <div key={`hour-${formatAxisHour(h)}`} className="contents">
                  <div
                    className="-mx-px -translate-y-[3.5px] self-start border-gridline border-t"
                    style={{ gridColumn: "2 / -1", gridRow: h + 2 }}
                  />
                  <div
                    className="-translate-y-[9px] pr-1 text-right text-xs whitespace-nowrap text-ink-faint"
                    style={{ gridColumn: 1, gridRow: h + 2 }}
                  >
                    {formatAxisHour(h)}
                  </div>
                </div>
              ))}
              {weekTiles.map(([d, h, span]) => (
                <Skeleton
                  key={`${d}-${h}`}
                  className="relative z-1 rounded-sm"
                  style={{
                    gridColumn: d + 2,
                    gridRow: `${h + 2} / span ${span}`,
                  }}
                />
              ))}
            </div>
          ) : (
            [0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="mb-1.5 grid grid-cols-[64px_1fr] gap-3 px-4"
              >
                <Skeleton className="mt-2.5 h-4 w-16" />
                <Skeleton className="h-14 rounded-lg" />
              </div>
            ))
          )}
        </div>
        <div
          aria-hidden="true"
          inert
          className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg px-3 pt-2.5 pb-[calc(24px+env(safe-area-inset-bottom))]"
        >
          <div className="mx-auto flex max-w-[640px] flex-col gap-2.5">
            <div className="flex items-center gap-1">
              <div className="flex flex-1 gap-1">
                {timetableDayNames.slice(0, 5).map((name, i) => (
                  <div
                    key={name}
                    className={`flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-full text-base font-medium ${
                      view === "day" && i === day
                        ? "bg-ink text-bg"
                        : "text-ink-muted"
                    }`}
                  >
                    {name.slice(0, 3)}
                  </div>
                ))}
              </div>
              {/* the day/week Segmented (sm) at rest */}
              <div className="relative ml-1.5 grid h-8 w-[84px] shrink-0 grid-cols-2 rounded-md bg-sunk p-[3px]">
                <span
                  className={`absolute top-[3px] bottom-[3px] left-[3px] w-[calc((100%-6px)/2)] rounded-[8px] bg-surface shadow-sm ${view === "week" ? "translate-x-full" : ""}`}
                />
                <span
                  className={`relative flex items-center justify-center ${view === "day" ? "text-ink" : "text-ink-muted"}`}
                >
                  <Rows3 size={16} />
                </span>
                <span
                  className={`relative flex items-center justify-center ${view === "week" ? "text-ink" : "text-ink-muted"}`}
                >
                  <Columns3 size={16} />
                </span>
              </div>
            </div>
            <div className="flex gap-2.5 px-1">
              <Skeleton className="h-12 flex-1 rounded-xl" />
              <Skeleton
                className={`h-12 rounded-xl ${page === "view" ? "flex-[.6]" : "flex-[.7]"}`}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      role="status"
      aria-label="Loading"
      className="flex h-[calc(100dvh-60px)] min-h-[600px] flex-col"
    >
      <div className="px-7 pt-[22px] pb-[18px]">
        <div className="flex h-[1lh] items-center text-3xl leading-[1.15]">
          <Skeleton className="h-9 w-[320px]" />
        </div>
        <div className={`mt-[5px] flex items-center text-[13px] ${metaHeight}`}>
          <Skeleton className="h-4 w-[260px]" />
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)] gap-5 px-7 pb-7 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col gap-2.5 overflow-hidden">
          <Skeleton
            className={`h-[46px] shrink-0 ${page === "edit" ? "mt-2" : ""}`}
          />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[60px] shrink-0 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-full rounded-xl" />
      </div>
    </div>
  );
}

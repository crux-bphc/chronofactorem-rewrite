import { Skeleton } from "@/components/ui/skeleton";
import { skeletonRef } from "@/lib/skeletonFade";

export const mainClass =
  "mx-auto w-full max-w-[640px] px-4 pb-12 lg:max-w-[1100px] lg:px-7";
export const gridClass = "grid gap-2 lg:grid-cols-3 lg:gap-3.5";
export const overlineClass =
  "mt-5 mb-2 text-xs font-semibold tracking-[.07em] text-ink-muted uppercase lg:mt-7 lg:mb-2.5";

const homeSkeletonRef = skeletonRef("home");

export function HomeSkeleton() {
  return (
    <main ref={homeSkeletonRef} className={mainClass} aria-busy="true">
      <h1 className="pt-2 text-2xl font-semibold lg:pt-10 lg:text-3xl">
        Timetables
      </h1>
      <Skeleton className="mt-5 mb-2 h-3 w-20 lg:mt-7 lg:mb-2.5" />
      <div className={gridClass}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="grid grid-cols-[92px_1fr_auto] items-center gap-3.5 rounded-xl border border-line bg-surface p-3.5"
          >
            <Skeleton className="h-16 w-[92px] rounded-[8px]" />
            {/* Rows sized by the card's own line heights; the desktop meta
                line usually wraps in a third of 1100px. */}
            <div className="min-w-0">
              <div className="flex h-[1lh] items-center text-lg">
                <Skeleton className="h-3.5 w-2/5" />
              </div>
              <div className="mt-[3px] flex h-[1lh] items-center text-sm lg:h-[2lh]">
                <Skeleton className="h-3 w-3/5" />
              </div>
              <Skeleton className="mt-[7px] h-[calc(1lh+6px)] w-16 rounded-full text-sm" />
            </div>
            <div className="size-9" />
          </div>
        ))}
      </div>
    </main>
  );
}

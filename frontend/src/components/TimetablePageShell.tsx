import { LoaderCircle } from "lucide-react";
import type React from "react";
import { TimetableSheet } from "@/components/timetable/TimetableSheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useTimetableState } from "@/context";
import { TIMETABLE_GRID_VT } from "@/lib/sharedTransition";
import { useSkeletonCrossfade } from "@/lib/skeletonFade";

export const TimetablePageShell = ({
  header,
  panel,
  dock,
  children,
}: {
  header: React.ReactNode;
  /** The course list or picker: the desktop panel, the phone courses sheet. */
  panel: React.ReactNode;
  /** The phone's bottom dock. */
  dock: React.ReactNode;
  children: React.ReactNode;
}) => {
  const {
    state: { isCopyingTimetable, screenIsLarge },
  } = useTimetableState();
  useSkeletonCrossfade("timetable");

  // The copy flow's wait is intentional feedback (useTimetableActions), so
  // the dialog can't be dismissed: it closes when the flow clears the flag.
  const copying = (
    <Dialog open={isCopyingTimetable}>
      <DialogContent
        hideClose
        aria-describedby={undefined}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        // focus parks on the dialog itself (nothing in it is interactive)
        className="flex w-[300px] flex-col items-center gap-4 text-center outline-none"
      >
        <LoaderCircle
          aria-hidden="true"
          className="size-6 animate-spin text-brand"
        />
        <div role="status">
          <DialogTitle className="text-[15px] font-medium">
            Please wait while we copy over your timetable...
          </DialogTitle>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (!screenIsLarge) {
    return (
      <main className="flex w-full flex-1 flex-col">
        <TooltipProvider>
          {header}
          <div
            style={{ viewTransitionName: TIMETABLE_GRID_VT }}
            className="mx-auto flex w-full max-w-[640px] flex-1 flex-col pb-[calc(156px+env(safe-area-inset-bottom))]"
          >
            {children}
          </div>
          {dock}
          <TimetableSheet courses={panel} />
          {copying}
        </TooltipProvider>
      </main>
    );
  }

  return (
    <main className="flex h-[calc(100dvh-60px)] min-h-[600px] flex-col">
      <TooltipProvider>
        {header}
        {/* 300px below 1280 so DeskGrid's minimums fit at 1024 (1024 - 56
            gutter - 300 - 20 gap = 648px); the spec's 360px from 1280. The
            page's px-7 is the 28px gutter for the panel and the grid card */}
        <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)] gap-5 px-7 pb-7 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside
            data-shot="side-menu"
            className="-mx-2 flex min-h-0 flex-col overflow-hidden px-2"
          >
            {panel}
          </aside>
          <div
            className="min-h-0"
            style={{ viewTransitionName: TIMETABLE_GRID_VT }}
          >
            {children}
          </div>
        </div>
        {copying}
      </TooltipProvider>
    </main>
  );
};

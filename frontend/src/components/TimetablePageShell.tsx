import type { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { LoaderCircle } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import NotFound from "@/components/NotFound";
import { skeletonShown } from "@/components/timetable/TimetablePageSkeleton";
import { TimetableSheet } from "@/components/timetable/TimetableSheet";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useTimetableState } from "@/context";
import { handleLoginRedirect } from "@/data-access/errors/handlers";
import toastHandler from "@/data-access/errors/toastHandler";
import { courseQueryOptions } from "@/data-access/hooks/useCourses";
import { timetableQueryOptions } from "@/data-access/hooks/useTimetable";
import { userQueryOptions } from "@/data-access/hooks/useUser";
import { TIMETABLE_GRID_VT } from "@/lib/sharedTransition";

export const timetablePageLoader = async ({
  context: { queryClient },
  params: { timetableId },
}: {
  context: { queryClient: QueryClient };
  params: { timetableId: string };
}) => {
  queryClient.ensureQueryData(userQueryOptions).catch(() => {
    // user is optional on timetable pages: viewing works logged out, so a
    // failed prefetch here is fine
  });
  // Courses are fetched for the semester of the timetable, so the timetable
  // has to be loaded first. Awaiting both keeps this data in the loader, so
  // preloading warms it before navigation (see
  // https://tanstack.com/router/v1/docs/guide/data-loading)
  const timetable = await queryClient.ensureQueryData(
    timetableQueryOptions(timetableId),
  );
  await queryClient.ensureQueryData(
    courseQueryOptions({
      acadYear: timetable.acadYear,
      semester: timetable.semester,
    }),
  );
};

export const TimetablePageError = ({ error }: { error: Error }) => {
  const { toast } = useToast();
  useEffect(() => {
    if (error instanceof AxiosError && error.response?.status === 404) return;
    handleLoginRedirect(error);
    toastHandler(error, toast);
  }, [error, toast]);
  // throwing notFound() from an errorComponent escapes to the root error
  // boundary instead of reaching notFoundComponent, so render it directly.
  // drafts 404 for anyone but their author, so this is a common path
  if (error instanceof AxiosError && error.response?.status === 404) {
    return <NotFound />;
  }
  return (
    <div
      role="alert"
      className="mx-auto flex w-full max-w-[320px] flex-1 flex-col items-center justify-center px-4 py-16 text-center"
    >
      <h1 className="text-xl font-semibold">Could not load this timetable</h1>
      <p className="mt-2 text-base leading-relaxed text-ink-muted">
        Try refreshing the page. If this keeps happening, report the issue using
        the notification.
      </p>
    </div>
  );
};

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
  // Crossfade from the loading skeleton, once: not on fast loads (the route's
  // view transition is the motion there) or when crossing 1024px. Opacity
  // only, as a transform would make <main> the dock's containing block.
  const [fade, setFade] = useState(skeletonShown);
  const fadeClass = fade
    ? "motion-safe:animate-[shell-fade_var(--d-2)_var(--e-out)]"
    : "";
  const endFade = (e: React.AnimationEvent) => {
    if (e.target === e.currentTarget) setFade(false);
  };

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
      <main className={`w-full flex-1 ${fadeClass}`} onAnimationEnd={endFade}>
        <TooltipProvider>
          {header}
          <div
            style={{ viewTransitionName: TIMETABLE_GRID_VT }}
            // room to scroll the grid clear of the dock
            className="mx-auto max-w-[640px] pb-[calc(156px+env(safe-area-inset-bottom))]"
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
    <main
      className={`flex h-[calc(100dvh-60px)] min-h-[600px] flex-col ${fadeClass}`}
      onAnimationEnd={endFade}
    >
      <TooltipProvider>
        {header}
        {/* 300px below 1280 so DeskGrid's minimums fit at 1024 (1024 - 56
            gutter - 300 - 20 gap = 648px); the spec's 360px from 1280. The
            page's px-7 is the 28px gutter for the panel and the grid card */}
        <div className="grid min-h-0 flex-1 grid-cols-[300px_minmax(0,1fr)] gap-5 px-7 pb-7 xl:grid-cols-[360px_minmax(0,1fr)]">
          <aside
            data-shot="side-menu"
            className="flex min-h-0 flex-col overflow-hidden"
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

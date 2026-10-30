import type { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Menu } from "lucide-react";
import type React from "react";
import { useEffect } from "react";
import BottomSheet from "@/components/BottomSheet";
import NotFound from "@/components/NotFound";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { TimetableActionType, useTimetableState } from "@/context";
import { handleLoginRedirect } from "@/data-access/errors/handlers";
import toastHandler from "@/data-access/errors/toastHandler";
import { courseQueryOptions } from "@/data-access/hooks/useCourses";
import { timetableQueryOptions } from "@/data-access/hooks/useTimetable";
import { userQueryOptions } from "@/data-access/hooks/useUser";
import { cn } from "@/lib/utils";

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
    <div role="alert" className="mx-auto max-w-md p-8 text-center">
      <h1 className="text-xl font-semibold">Could not load this timetable</h1>
      <p className="mt-2 text-muted-foreground">
        Try refreshing the page. If this keeps happening, report the issue using
        the notification.
      </p>
    </div>
  );
};

export const TimetablePageShell = ({
  header,
  sidebar,
  contentRef,
  contentClassName,
  popoverTriggerClassName,
  children,
}: {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  contentRef?: React.Ref<HTMLDivElement>;
  contentClassName?: string;
  popoverTriggerClassName?: string;
  children: React.ReactNode;
}) => {
  const {
    state: { isCopyingTimetable, screenIsLarge, sidebarOpen },
    dispatch,
  } = useTimetableState();
  useEffect(() => {
    if (screenIsLarge)
      dispatch({ type: TimetableActionType.SetSidebarOpen, open: false });
  }, [screenIsLarge, dispatch]);

  if (isCopyingTimetable) {
    return (
      <div className="flex flex-col text-muted-foreground gap-8 xl:text-xl lg:text-lg md:text-md text-sm bg-background h-[calc(100dvh-5rem)] justify-center w-full items-center">
        <Spinner />
        <span>Please wait while we copy over your timetable...</span>
      </div>
    );
  }

  return (
    <main
      className={cn(
        "w-full min-w-0",
        screenIsLarge ? "flex-none h-[calc(100vh-12rem)]" : "flex-1 pb-6",
        // leave room to scroll the whole grid above the open sheet
        !screenIsLarge && sidebarOpen && "pb-[calc(max(45dvh,16rem)+1.5rem)]",
      )}
    >
      <TooltipProvider>
        {header}
        {!screenIsLarge && (
          <BottomSheet
            open={sidebarOpen}
            onOpenChange={(open) =>
              dispatch({ type: TimetableActionType.SetSidebarOpen, open })
            }
            // tapping the grid shouldn't close the sheet
            dismissOnOutsideTap={false}
            title="Courses and exams"
            description="Browse courses, choose sections, and review exam dates."
            className="h-[45dvh] min-h-64"
            trigger={
              <Button
                variant="outline"
                // phones get this button in the header, next to Publish
                className={cn(
                  "mb-4 ml-4 gap-2 max-sm:hidden",
                  popoverTriggerClassName,
                )}
              >
                <Menu className="size-4" />
                Courses and exams
              </Button>
            }
          >
            <div className="min-h-0 flex-1 overflow-hidden">{sidebar}</div>
          </BottomSheet>
        )}
        <div
          className={cn(
            "flex flex-row gap-4 relative min-w-0",
            screenIsLarge ? "h-full" : "items-start",
            contentClassName,
          )}
          ref={contentRef}
        >
          {screenIsLarge && (
            <aside className="bg-secondary w-[26rem] shrink-0 overflow-hidden">
              {sidebar}
            </aside>
          )}
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </TooltipProvider>
    </main>
  );
};

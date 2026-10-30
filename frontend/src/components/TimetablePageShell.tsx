import type { QueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Menu } from "lucide-react";
import type React from "react";
import { useEffect } from "react";
import NotFound from "@/components/NotFound";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
    state: { screenIsLarge, sidebarOpen },
    dispatch,
  } = useTimetableState();
  useEffect(() => {
    if (screenIsLarge)
      dispatch({ type: TimetableActionType.SetSidebarOpen, open: false });
  }, [screenIsLarge, dispatch]);

  return (
    <main className="w-full flex-1 min-w-0 px-3 pb-6 sm:px-6">
      <TooltipProvider>
        {header}
        {!screenIsLarge && (
          <Dialog
            open={sidebarOpen}
            onOpenChange={(open) =>
              dispatch({ type: TimetableActionType.SetSidebarOpen, open })
            }
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className={cn("mb-4 gap-2", popoverTriggerClassName)}
              >
                <Menu className="size-4" />
                Courses and exams
              </Button>
            </DialogTrigger>
            <DialogContent className="flex h-[85dvh] w-[calc(100%-1.5rem)] max-w-md flex-col overflow-hidden p-4">
              <DialogHeader>
                <DialogTitle>Courses and exams</DialogTitle>
                <DialogDescription className="sr-only">
                  Browse courses, choose sections, and review exam dates.
                </DialogDescription>
              </DialogHeader>
              <div className="min-h-0 flex-1 overflow-hidden">{sidebar}</div>
            </DialogContent>
          </Dialog>
        )}
        <div
          className={cn("flex min-w-0 items-start gap-6", contentClassName)}
          ref={contentRef}
        >
          {screenIsLarge && (
            <aside className="sticky top-4 h-[calc(100dvh-14rem)] min-h-96 w-80 shrink-0 overflow-hidden rounded-xl border bg-card xl:w-88">
              {sidebar}
            </aside>
          )}
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </TooltipProvider>
    </main>
  );
};

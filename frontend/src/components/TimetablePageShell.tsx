import type { QueryClient } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import type React from "react";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useTimetableState } from "@/context";
import {
  handleLoginRedirect,
  handleNotFound,
} from "@/data-access/errors/handlers";
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
  queryClient.ensureQueryData(userQueryOptions);
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
  handleLoginRedirect(error);
  handleNotFound(error);
  toastHandler(error, toast);
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
    state: { isCopyingTimetable, screenIsLarge },
  } = useTimetableState();

  if (isCopyingTimetable) {
    return (
      <div className="flex flex-col text-muted-foreground gap-8 xl:text-xl lg:text-lg md:text-md text-sm bg-background h-[calc(100dvh-5rem)] justify-center w-full items-center">
        <Spinner />
        <span>Please wait while we copy over your timetable...</span>
      </div>
    );
  }

  return (
    <div className="grow h-[calc(100vh-12rem)]">
      <TooltipProvider>
        {header}
        <div
          className={cn(
            "flex flex-row gap-4 h-full relative",
            contentClassName,
          )}
          ref={contentRef}
        >
          {screenIsLarge ? (
            sidebar
          ) : (
            <Popover>
              <PopoverTrigger
                className={cn("absolute left-2", popoverTriggerClassName)}
              >
                <Button variant={"default"} className="rounded-full">
                  <Menu />
                </Button>
              </PopoverTrigger>
              <PopoverContent>{sidebar}</PopoverContent>
            </Popover>
          )}
          {children}
        </div>
      </TooltipProvider>
    </div>
  );
};

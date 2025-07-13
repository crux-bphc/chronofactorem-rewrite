import { Route } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useEffect } from "react";
import CourseDetailsMenu from "@/components/CourseDetailsMenu";
import ReportIssue from "@/components/ReportIssue";
import TimetableHeader from "@/components/TimetableHeader";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  TimetableActionType,
  TimetableProvider,
  useTimetableState,
} from "@/context";
import {
  handleLoginRedirect,
  handleNotFound,
} from "@/data-access/errors/handlers";
import toastHandler from "@/data-access/errors/toastHandler";
import { courseQueryOptions } from "@/data-access/hooks/useCourses";
import { timetableQueryOptions } from "@/data-access/hooks/useTimetable";
import useTimetableSectionAction from "@/data-access/hooks/useTimetableSectionAction";
import { userQueryOptions } from "@/data-access/hooks/useUser";
import authenticatedRoute from "../AuthenticatedRoute";
import NotFound from "../components/NotFound";
import { SideMenu } from "../components/SideMenu";
import Spinner from "../components/Spinner";
import { TimetableGrid } from "../components/TimetableGrid";
import { Button } from "../components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import { toast, useToast } from "../components/ui/use-toast";
import { router } from "../main";

const editTimetableRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "edit/$timetableId",
  loader: ({ context: { queryClient }, params: { timetableId } }) => {
    queryClient.ensureQueryData(userQueryOptions);
    queryClient.ensureQueryData(courseQueryOptions);
    queryClient.ensureQueryData(timetableQueryOptions(timetableId));
  },
  component: () => (
    <TimetableProvider>
      <EditTimetable />
    </TimetableProvider>
  ),
  notFoundComponent: NotFound,
  errorComponent: ({ error }) => {
    const { toast } = useToast();
    handleLoginRedirect(error);
    handleNotFound(error);
    toastHandler(error, toast);
  },
});

function EditTimetable() {
  const {
    state: {
      isVertical,
      isLoading,
      user,
      courses,
      timetable,
      currentCourseID,
      screenIsLarge,
    },
    dispatch,
  } = useTimetableState();

  useEffect(() => {
    if (!timetable) return;
    if (timetable.draft) return;
    toast({
      title: "Error",
      description: "Non-draft timetables cannot be edited",
      variant: "destructive",
    });
    router.navigate({
      to: "/view/$timetableId",
      params: { timetableId: timetable.id },
    });
  }, [timetable]);

  useEffect(() => {
    if (!timetable || !user) return;
    if (user.id === timetable.authorId) return;
    toast({
      title: "Error",
      description: "You are not authorized to edit this timetable",
      variant: "destructive",
    });
    router.navigate({
      to: "/",
    });
  }, [timetable, user]);

  const { mutate: sectionAction } = useTimetableSectionAction(timetable?.id);

  if (timetable === undefined || courses === undefined || user === undefined) {
    return <ReportIssue error={"Error fetching queries"} />;
  }

  const SideBar =
    currentCourseID !== null ? (
      <CourseDetailsMenu />
    ) : (
      <SideMenu isOnEditPage={true} isScreenshotMode={false} />
    );

  return (
    <>
      {isLoading ? (
        <div className="flex flex-col text-muted-foreground gap-8 xl:text-xl lg:text-lg md:text-md text-sm bg-background h-[calc(100dvh-5rem)] justify-center w-full items-center">
          <Spinner />
          <span>Please wait while we copy over your timetable...</span>
        </div>
      ) : (
        <div className="grow h-[calc(100vh-12rem)]">
          <TooltipProvider>
            <TimetableHeader
              isOnEditPage={true}
              generateScreenshot={() => null}
            />
            <div className="flex flex-row gap-4 h-full relative">
              {screenIsLarge ? (
                SideBar
              ) : (
                <Popover>
                  <PopoverTrigger className="absolute left-2 top-[-1rem]">
                    <Button variant={"default"} className="rounded-full">
                      <Menu />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>{SideBar}</PopoverContent>
                </Popover>
              )}
              <TimetableGrid
                isVertical={screenIsLarge ? isVertical : true}
                handleUnitClick={(e, event) => {
                  if (e?.courseId && e?.type) {
                    if (event.detail === 1) {
                      dispatch({
                        type: TimetableActionType.SetSelectedCourseAndSection,
                        courseID: courses.filter(
                          (x) => x.code === e?.courseId,
                        )[0].id,
                        sectionType: e?.type as "L" | "P" | "T",
                      });
                    } else if (event.detail >= 2) {
                      e?.id
                        ? sectionAction({ sectionId: e?.id, action: "remove" })
                        : console.log("error:", e);
                    }
                  } else {
                    console.log("error:", e);
                  }
                }}
                handleUnitDelete={(e) => {
                  e?.id
                    ? sectionAction({ sectionId: e?.id, action: "remove" })
                    : console.log("error:", e);
                }}
                isOnEditPage={true}
              />
            </div>
          </TooltipProvider>
        </div>
      )}
    </>
  );
}

export default editTimetableRoute;

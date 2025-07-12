import { Route } from "@tanstack/react-router";
import { toPng } from "html-to-image";
import { Menu } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import ReportIssue from "@/components/ReportIssue";
import ReportIssueToastAction from "@/components/ReportIssueToastAction";
import TimetableHeader from "@/components/TimetableHeader";
import {
  TimetableActionType,
  TimetableProvider,
  useTimetableState,
} from "@/context";
import handleNotFound from "@/data-access/errors/handleNotFound";
import handleLoginRedirect from "@/data-access/errors/redirectToLogin";
import toastHandler from "@/data-access/errors/toastHandler";
import { courseQueryOptions } from "@/data-access/useCourses";
import { timetableQueryOptions } from "@/data-access/useTimetable";
import { userQueryOptions } from "@/data-access/useUser";
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
import { TooltipProvider } from "../components/ui/tooltip";
import { toast, useToast } from "../components/ui/use-toast";

const viewTimetableRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "view/$timetableId",
  loader: ({ context: { queryClient }, params: { timetableId } }) => {
    queryClient.ensureQueryData(userQueryOptions);
    queryClient.ensureQueryData(courseQueryOptions);
    queryClient.ensureQueryData(timetableQueryOptions(timetableId));
  },
  component: () => (
    <TimetableProvider>
      <ViewTimetable />
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

function ViewTimetable() {
  const {
    state: { isLoading, isVertical, user, courses, timetable, screenIsLarge },
    dispatch,
  } = useTimetableState();

  const screenshotContentRef = useRef<HTMLDivElement>(null);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);

  useEffect(() => {
    window.matchMedia("(min-width: 1024px)").addEventListener("change", (e) =>
      dispatch({
        type: TimetableActionType.UpdateScreenIsLarge,
        screenIsLarge: e.matches,
      }),
    );
  }, [dispatch]);

  const generateScreenshot = useCallback(() => {
    const screenShotContent = screenshotContentRef.current;
    setIsScreenshotMode(true);
    const isLarge = screenIsLarge;
    dispatch({
      type: TimetableActionType.UpdateScreenIsLarge,
      screenIsLarge: true,
    });

    if (screenShotContent === null) {
      return;
    }

    // use some standard values where it is going to render properly
    screenShotContent.style.height = isVertical ? "640px" : "512px";
    screenShotContent.style.width = "1920px";

    toPng(screenShotContent, {
      cacheBust: true,
    })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = "timetable.png";
        link.href = dataUrl;
        link.click();

        // later remove those values let the browser figure it out the proper values
        screenShotContent.style.height = "";
        screenShotContent.style.width = "";

        setIsScreenshotMode(false);
        dispatch({
          type: TimetableActionType.UpdateScreenIsLarge,
          screenIsLarge: isLarge,
        });
      })
      .catch((err: Error) => {
        setIsScreenshotMode(false);
        dispatch({
          type: TimetableActionType.UpdateScreenIsLarge,
          screenIsLarge: isLarge,
        });

        console.error("something went wrong with image generation", err);
        toast({
          title: "Error",
          description: err.message,
          variant: "destructive",
          action: <ReportIssueToastAction />,
        });
      });
  }, [screenIsLarge, dispatch, isVertical]);

  if (timetable === undefined || courses === undefined || user === undefined) {
    return <ReportIssue error={"Error fetching queries"} />;
  }

  const SideBar = (
    <SideMenu isOnEditPage={false} isScreenshotMode={isScreenshotMode} />
  );

  return (
    <>
      {!isLoading ? (
        <div className="grow h-[calc(100vh-12rem)]">
          <TooltipProvider>
            <TimetableHeader
              isOnEditPage={false}
              generateScreenshot={generateScreenshot}
            />
            {/* the bg-background here is necessary so the generated image has the background in it */}
            <div
              className="flex flex-row gap-4 bg-background h-full relative"
              ref={screenshotContentRef}
            >
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
                handleUnitClick={(e) => console.log(e)}
                handleUnitDelete={(e) => console.log("DELETING", e)}
                isOnEditPage={false}
              />
            </div>
          </TooltipProvider>
        </div>
      ) : (
        <div className="flex flex-col text-muted-foreground gap-8 xl:text-xl lg:text-lg md:text-md text-sm bg-background h-[calc(100dvh-5rem)] justify-center w-full items-center">
          <Spinner />
          <span>Please wait while we copy over your timetable...</span>
        </div>
      )}
    </>
  );
}

export default viewTimetableRoute;

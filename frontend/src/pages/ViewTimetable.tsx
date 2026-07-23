import { Route } from "@tanstack/react-router";
import { toPng } from "html-to-image";
import { useCallback, useRef, useState } from "react";
import ReportIssue from "@/components/ReportIssue";
import ReportIssueToastAction from "@/components/ReportIssueToastAction";
import TimetableHeader from "@/components/TimetableHeader";
import {
  TimetablePageError,
  TimetablePageShell,
  timetablePageLoader,
} from "@/components/TimetablePageShell";
import {
  TimetableActionType,
  TimetableProvider,
  useTimetableState,
} from "@/context";
import authenticatedRoute from "../AuthenticatedRoute";
import CenteredSpinner from "../components/CenteredSpinner";
import NotFound from "../components/NotFound";
import { SideMenu } from "../components/SideMenu";
import { TimetableGrid } from "../components/TimetableGrid";
import { toast } from "../components/ui/use-toast";

const viewTimetableRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "view/$timetableId",
  loader: timetablePageLoader,
  pendingComponent: CenteredSpinner,
  component: () => (
    <TimetableProvider>
      <ViewTimetable />
    </TimetableProvider>
  ),
  notFoundComponent: NotFound,
  errorComponent: TimetablePageError,
});

function ViewTimetable() {
  const {
    state: { isVertical, user, courses, timetable, screenIsLarge },
    dispatch,
  } = useTimetableState();

  const screenshotContentRef = useRef<HTMLDivElement>(null);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);

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
    <TimetablePageShell
      header={
        <TimetableHeader
          isOnEditPage={false}
          generateScreenshot={generateScreenshot}
        />
      }
      sidebar={SideBar}
      contentRef={screenshotContentRef}
      // the bg-background here is necessary so the generated image has the background in it
      contentClassName="bg-background"
      popoverTriggerClassName="top-[-1rem]"
    >
      <TimetableGrid
        isVertical={screenIsLarge ? isVertical : true}
        isOnEditPage={false}
      />
    </TimetablePageShell>
  );
}

export default viewTimetableRoute;

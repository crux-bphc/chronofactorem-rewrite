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
import { TooltipProvider } from "@/components/ui/tooltip";
import { TimetableProvider, useTimetableState } from "@/context";
import { timetableSearchSchema } from "@/lib/timetableSearch";
import CenteredSpinner from "../components/CenteredSpinner";
import NotFound from "../components/NotFound";
import { SideMenu } from "../components/SideMenu";
import { TimetableGrid } from "../components/TimetableGrid";
import { toast } from "../components/ui/use-toast";
import { rootRoute } from "../router";

const viewTimetableRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "view/$timetableId",
  loader: timetablePageLoader,
  validateSearch: timetableSearchSchema,
  loaderDeps: () => ({}),
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
    state: { isVertical, courses, timetable, screenIsLarge },
  } = useTimetableState();

  const screenshotContentRef = useRef<HTMLDivElement>(null);
  const [isScreenshotMode, setIsScreenshotMode] = useState(false);

  const generateScreenshot = useCallback(async () => {
    if (isScreenshotMode) return;
    setIsScreenshotMode(true);
    try {
      // wait for the offscreen copy below to mount and lay out
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      await document.fonts.ready;
      const content = screenshotContentRef.current;
      if (!content)
        throw new Error(
          "The timetable image could not be prepared. Please try again.",
        );
      const dataUrl = await toPng(content, {
        cacheBust: true,
        pixelRatio: 2,
        style: { position: "static" },
      });
      const link = document.createElement("a");
      link.download = "timetable.png";
      link.href = dataUrl;
      link.click();
    } catch (error) {
      toast({
        title: "Could not export timetable",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
        action: <ReportIssueToastAction />,
      });
    } finally {
      setIsScreenshotMode(false);
    }
  }, [isScreenshotMode]);

  if (timetable === undefined || courses === undefined) {
    return <ReportIssue error={"Error fetching queries"} />;
  }

  const SideBar = <SideMenu isOnEditPage={false} isScreenshotMode={false} />;

  return (
    <>
      <TimetablePageShell
        header={
          <TimetableHeader
            isOnEditPage={false}
            generateScreenshot={generateScreenshot}
            isExporting={isScreenshotMode}
          />
        }
        sidebar={SideBar}
        contentClassName="bg-background"
        popoverTriggerClassName="top-[-1rem]"
      >
        <TimetableGrid
          isVertical={screenIsLarge ? isVertical : true}
          isOnEditPage={false}
        />
      </TimetablePageShell>
      {isScreenshotMode && (
        <TooltipProvider>
          {/* rendered offscreen at a fixed desktop width so the export never
          resizes the live page. responsive classes still follow the viewport */}
          <div
            aria-hidden="true"
            className="pointer-events-none fixed left-[-10000px] top-0 w-480 bg-background p-8"
            ref={screenshotContentRef}
          >
            <h2 className="mb-2 text-2xl font-semibold">{timetable.name}</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {timetable.acadYear}-
              {(timetable.acadYear + 1).toString().slice(2)}, Semester{" "}
              {timetable.semester}
            </p>
            <div className="grid grid-cols-[auto_1fr] gap-6">
              {/* show the whole exam list instead of a viewport-high scroll box */}
              <div className="[&_[data-orientation]]:h-auto [&_[role=tabpanel]]:overflow-visible">
                <SideMenu isOnEditPage={false} isScreenshotMode={true} />
              </div>
              {/* a stretched grid cell has a definite height, so the grid's
              h-full rows and time labels line up like on the live page */}
              <div className="min-w-0 [&>div]:h-full">
                <TimetableGrid
                  isVertical={isVertical}
                  isOnEditPage={false}
                  isExport
                />
              </div>
            </div>
            <p className="mt-6 text-xs text-muted-foreground">
              Made with ChronoFactorem
            </p>
          </div>
        </TooltipProvider>
      )}
    </>
  );
}

export default viewTimetableRoute;

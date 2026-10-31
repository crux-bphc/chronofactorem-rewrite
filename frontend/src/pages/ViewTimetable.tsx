import { Route } from "@tanstack/react-router";
import { useMemo } from "react";
import ReportIssue from "@/components/ReportIssue";
import TimetableHeader from "@/components/TimetableHeader";
import {
  TimetablePageError,
  TimetablePageShell,
  timetablePageLoader,
} from "@/components/TimetablePageShell";
import { InterimPhoneControls } from "@/components/timetable/InterimPhoneControls";
import { TimetableSurface } from "@/components/timetable/TimetableSurface";
import { TimetableProvider, useTimetableState } from "@/context";
import { timetableSearchSchema } from "@/lib/timetableSearch";
import { useSurfaceNav } from "@/lib/useSurfaceNav";
import { useTimetableExport } from "@/lib/useTimetableExport";
import { buildTimetableGrid } from "@/utils/timetableGrid";
import CenteredSpinner from "../components/CenteredSpinner";
import NotFound from "../components/NotFound";
import { SideMenu } from "../components/SideMenu";
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
    state: {
      isVertical,
      courses,
      timetable,
      screenIsLarge,
      timetableDetailsSections,
    },
  } = useTimetableState();
  const { dayCount } = useMemo(
    () => buildTimetableGrid(timetableDetailsSections),
    [timetableDetailsSections],
  );
  const { view, day } = useSurfaceNav(dayCount);

  const { status, exportPng, exportElement } = useTimetableExport();

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
            generateScreenshot={exportPng}
            isExporting={status === "rendering"}
          />
        }
        sidebar={SideBar}
        contentClassName="bg-background"
        popoverTriggerClassName="top-[-1rem]"
      >
        {!screenIsLarge && <InterimPhoneControls dayCount={dayCount} />}
        <TimetableSurface
          sections={timetableDetailsSections}
          layout={screenIsLarge ? "desktop" : "phone"}
          view={view}
          day={day}
          orientation={isVertical ? "columns" : "rows"}
          mode="view"
          showNow
        />
      </TimetablePageShell>
      {exportElement}
    </>
  );
}

export default viewTimetableRoute;

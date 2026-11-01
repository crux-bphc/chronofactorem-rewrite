import { createLazyRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import ReportIssue from "@/components/ReportIssue";
import TimetableHeader from "@/components/TimetableHeader";
import { TimetablePageShell } from "@/components/TimetablePageShell";
import { ExportButton } from "@/components/timetable/HeaderActions";
import { TimetableDock } from "@/components/timetable/TimetableDock";
import { TimetablePageSkeleton } from "@/components/timetable/TimetablePageSkeleton";
import { TimetableSurface } from "@/components/timetable/TimetableSurface";
import { TimetableProvider, useTimetableState } from "@/context";
import { useSurfaceNav } from "@/lib/useSurfaceNav";
import { useTimetableExport } from "@/lib/useTimetableExport";
import { buildTimetableGrid } from "@/utils/timetableGrid";
import { SideMenu } from "../components/SideMenu";

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
  const { view, day, showDay } = useSurfaceNav(dayCount);

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
            page="view"
            exportStatus={status}
            onExport={exportPng}
          />
        }
        panel={SideBar}
        dock={
          <TimetableDock
            dayCount={dayCount}
            actions={
              <div className="flex min-w-0 flex-[.6] *:flex-1">
                <ExportButton
                  status={status}
                  onExport={exportPng}
                  layout="phone"
                />
              </div>
            }
          />
        }
      >
        <TimetableSurface
          sections={timetableDetailsSections}
          layout={screenIsLarge ? "desktop" : "phone"}
          view={view}
          day={day}
          orientation={isVertical ? "columns" : "rows"}
          mode="view"
          showNow
          onShowDay={showDay}
        />
      </TimetablePageShell>
      {exportElement}
    </>
  );
}

export const Route = createLazyRoute("/view/$timetableId")({
  component: () => (
    <TimetableProvider fallback={<TimetablePageSkeleton page="view" />}>
      <ViewTimetable />
    </TimetableProvider>
  ),
});

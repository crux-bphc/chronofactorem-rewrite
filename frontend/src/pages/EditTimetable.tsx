import { Route } from "@tanstack/react-router";
import { useEffect } from "react";
import CourseDetailsMenu from "@/components/CourseDetailsMenu";
import ReportIssue from "@/components/ReportIssue";
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
import { useAddRemoveTimetableSection } from "@/data-access/hooks/useTimetableSectionAction";
import authenticatedRoute from "../AuthenticatedRoute";
import CenteredSpinner from "../components/CenteredSpinner";
import NotFound from "../components/NotFound";
import { SideMenu } from "../components/SideMenu";
import { TimetableGrid } from "../components/TimetableGrid";
import { toast } from "../components/ui/use-toast";
import { router } from "../router";

const editTimetableRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "edit/$timetableId",
  loader: timetablePageLoader,
  pendingComponent: CenteredSpinner,
  component: () => (
    <TimetableProvider>
      <EditTimetable />
    </TimetableProvider>
  ),
  notFoundComponent: NotFound,
  errorComponent: TimetablePageError,
});

function EditTimetable() {
  const {
    state: {
      isVertical,
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

  const { mutate: sectionAction } = useAddRemoveTimetableSection(timetable?.id);

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
    <TimetablePageShell
      header={<TimetableHeader isOnEditPage={true} />}
      sidebar={SideBar}
    >
      <TimetableGrid
        isVertical={screenIsLarge ? isVertical : true}
        handleUnitClick={(e, event) => {
          if (e?.courseId && e?.type) {
            if (event.detail === 1) {
              dispatch({
                type: TimetableActionType.SetSelectedCourseAndSection,
                courseID: courses.filter((x) => x.code === e?.courseId)[0].id,
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
    </TimetablePageShell>
  );
}

export default editTimetableRoute;

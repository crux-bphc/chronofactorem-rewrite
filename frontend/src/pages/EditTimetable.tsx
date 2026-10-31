import { useIsMutating } from "@tanstack/react-query";
import { Route } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import CourseDetailsMenu from "@/components/CourseDetailsMenu";
import ReportIssue from "@/components/ReportIssue";
import TimetableHeader from "@/components/TimetableHeader";
import {
  TimetablePageError,
  TimetablePageShell,
  timetablePageLoader,
} from "@/components/TimetablePageShell";
import { PublishButton } from "@/components/timetable/HeaderActions";
import { InterimPhoneControls } from "@/components/timetable/InterimPhoneControls";
import { TimetableSurface } from "@/components/timetable/TimetableSurface";
import { TimetableProvider, useTimetableState } from "@/context";
import useCourse from "@/data-access/hooks/useCourse";
import { useAddRemoveTimetableSection } from "@/data-access/hooks/useTimetableSectionAction";
import {
  SectionPreviewProvider,
  useSectionPreview,
} from "@/lib/sectionPreview";
import { timetableSearchSchema } from "@/lib/timetableSearch";
import { useSurfaceNav } from "@/lib/useSurfaceNav";
import { useTimetableNav } from "@/lib/useTimetableNav";
import { buildTimetableGrid } from "@/utils/timetableGrid";
import authenticatedRoute from "../AuthenticatedRoute";
import CenteredSpinner from "../components/CenteredSpinner";
import NotFound from "../components/NotFound";
import { SideMenu } from "../components/SideMenu";
import { toast } from "../components/ui/use-toast";
import { router } from "../router";

const editTimetableRoute = new Route({
  getParentRoute: () => authenticatedRoute,
  path: "edit/$timetableId",
  loader: timetablePageLoader,
  validateSearch: timetableSearchSchema,
  loaderDeps: () => ({}),
  pendingComponent: CenteredSpinner,
  component: () => (
    <TimetableProvider>
      <SectionPreviewProvider>
        <EditTimetable />
      </SectionPreviewProvider>
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
      timetableDetailsSections,
      course,
    },
  } = useTimetableState();
  const { openCourse } = useTimetableNav();
  const { preview, setPreview } = useSectionPreview();
  const { dayCount } = useMemo(
    () => buildTimetableGrid(timetableDetailsSections),
    [timetableDetailsSections],
  );
  const { view, day } = useSurfaceNav(dayCount);
  const pending =
    useIsMutating({ mutationKey: ["sections", timetable?.id] }) > 0;
  // an unknown course id (stale or hand-edited URL) shows the list instead
  const { isLoading: isCourseLoading, data: courseData } =
    useCourse(currentCourseID);

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

  // a section's day and hour, without the course code and room
  const slot = (roomTime: string) => roomTime.split(":").slice(2).join(":");
  // The picker reports mouse hovers; ghost the row on the grid unless it is
  // already in the timetable or clashes with something that is.
  const handleSectionHover = (sectionId: string | null) => {
    const section = course?.sections.find((s) => s.id === sectionId);
    if (
      !course ||
      !section ||
      timetable.sections.some(
        (item) =>
          item.id === section.id ||
          (!(
            item.courseId === section.courseId && item.type === section.type
          ) &&
            item.roomTime.some((existing) =>
              section.roomTime.some(
                (incoming) => slot(existing) === slot(incoming),
              ),
            )),
      )
    ) {
      setPreview(null);
      return;
    }
    setPreview({ ...section, name: course.name, courseId: course.code });
  };
  // a ghost whose section just got added gives way to the real block
  const ghost =
    preview && !timetable.sections.some((item) => item.id === preview.id)
      ? preview
      : null;

  const SideBar =
    currentCourseID !== null && (isCourseLoading || courseData) ? (
      <CourseDetailsMenu
        showHeader={screenIsLarge}
        onSectionHover={handleSectionHover}
      />
    ) : (
      <SideMenu isOnEditPage={true} isScreenshotMode={false} />
    );

  return (
    <TimetablePageShell
      header={<TimetableHeader page="edit" />}
      panel={SideBar}
      dock={null}
    >
      {!screenIsLarge && (
        <InterimPhoneControls
          dayCount={dayCount}
          action={<PublishButton layout="phone" />}
        />
      )}
      <TimetableSurface
        sections={timetableDetailsSections}
        layout={screenIsLarge ? "desktop" : "phone"}
        view={view}
        day={day}
        orientation={isVertical ? "columns" : "rows"}
        mode="edit"
        preview={ghost}
        pending={pending}
        onOpen={(e, event) => {
          if (e?.courseId && e?.type) {
            if (event.detail <= 1) {
              openCourse(
                courses.filter((x) => x.code === e?.courseId)[0].id,
                e?.type as "L" | "P" | "T",
              );
            } else if (event.detail >= 2) {
              e?.id
                ? sectionAction({ sectionId: e?.id, action: "remove" })
                : console.log("error:", e);
            }
          } else {
            console.log("error:", e);
          }
        }}
        onRemove={(e) => {
          e?.id
            ? sectionAction({ sectionId: e?.id, action: "remove" })
            : console.log("error:", e);
        }}
      />
    </TimetablePageShell>
  );
}

export default editTimetableRoute;

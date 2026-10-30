import { useTimetableState } from "@/context";
import { TabsContent } from "./ui/tabs";

const ViewCoursesTab = () => {
  const {
    state: { coursesInTimetable, timetable },
  } = useTimetableState();

  if (timetable === undefined) return;

  return (
    <TabsContent
      value="courses"
      className="flex min-h-0 flex-1 data-[state=inactive]:hidden overflow-y-auto flex-col px-2 gap-2"
    >
      {coursesInTimetable.map((course) => {
        if (course === undefined) return null;
        return (
          <div
            className="flex flex-col border-muted-foreground/30 rounded-md pl-3 py-2 border"
            key={course.id}
          >
            <div className="flex">
              <span className="font-bold">{`${course.code}`}</span>
              <span>{`: ${course.name}`}</span>
            </div>
            <span className="text-muted-foreground">{`${timetable.sections
              .filter((section) => section.courseId === course.id)
              .map((section) => `${section.type}${section.number}`)
              .sort()
              .join(", ")}`}</span>
          </div>
        );
      })}
    </TabsContent>
  );
};

export default ViewCoursesTab;

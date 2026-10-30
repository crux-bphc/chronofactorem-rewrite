import { ChevronRight } from "lucide-react";
import { TimetableActionType, useTimetableState } from "@/context";
import { Button } from "./ui/button";
import { TabsContent } from "./ui/tabs";

const EditCoursesTab = () => {
  const {
    state: { coursesInTimetable },
    dispatch,
  } = useTimetableState();
  return (
    <TabsContent
      value="currentCourses"
      className="flex min-h-0 flex-1 data-[state=inactive]:hidden overflow-y-auto flex-col gap-2"
    >
      {coursesInTimetable.map((course) => {
        return (
          <Button
            variant={"secondary"}
            onClick={() => {
              dispatch({
                type: TimetableActionType.SetSelectedCourseAndSection,
                courseID: course.id,
                sectionType: null,
              });
            }}
            key={course.id}
            className="h-auto min-h-16 shrink-0 whitespace-normal rounded-lg text-left p-3"
          >
            <div className="flex justify-between w-full items-center">
              <span>{`${course.code}: ${course.name}`}</span>
              <ChevronRight />
            </div>
          </Button>
        );
      })}
    </TabsContent>
  );
};

export default EditCoursesTab;
